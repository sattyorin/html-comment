import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";

/*
 * 設定インターフェース
 * コメントの開始部分と終了部分を定義します。
 */
interface HtmlCommentPluginSettings {
    commentStart: string; // コメント開始部分
    commentEnd: string;   // コメント終了部分
}

/*
 * デフォルト設定
 * 初期状態でのコメント開始部分と終了部分を設定。
 */
const DEFAULT_SETTINGS: HtmlCommentPluginSettings = {
    commentStart: "<!--",
    commentEnd: "-->",
};

export default class HtmlCommentPlugin extends Plugin {
    settings: HtmlCommentPluginSettings;

    /* プラグインのロード時に実行される処理 */
    async onload() {
        console.log("HTML Comment Plugin loaded");

        // 設定をロード
        await this.loadSettings();
        // 設定画面を追加
        this.addSettingTab(new HtmlCommentSettingTab(this.app, this));

        // コマンドを登録
        this.addCommand({
            id: "toggle-html-comment",
            name: "Toggle HTML Comment",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.handleToggleHtmlComment(editor);
            },
            hotkeys: [
                {
                    modifiers: ["Ctrl"],
                    key: "/",
                },
            ],
        });
    }

    /**
     * コメント切り替えのメイン処理
     * ユーザーの選択範囲やカーソル位置に応じて、適切に処理を分岐。
     * @param editor - エディターインスタンス
     */
    private handleToggleHtmlComment(editor: Editor): void {
        try {
            const selectedText = editor.getSelection();
            const cursorStart = editor.getCursor("from");
            const cursorEnd = editor.getCursor("to");

            if (selectedText && cursorStart.line !== cursorEnd.line) {
                // 複数行選択時の処理
                this.toggleCommentForMultipleLines(editor, cursorStart, cursorEnd);
                return;
            }

            if (selectedText) {
                // 単一行の選択範囲の処理
                editor.replaceSelection(this.toggleCommentForSingleLine(selectedText));
                return;
            }

            // 選択範囲がない場合（カーソル位置の行を処理）
            const cursor = editor.getCursor();
            const currentLineText = editor.getLine(cursor.line);
            editor.setLine(cursor.line, this.toggleCommentForSingleLine(currentLineText));
            editor.setCursor(cursor); // 元の位置にカーソルを戻す
        } catch (error) {
            console.error("Error while toggling HTML comment:", error);
        }
    }

    /**
     * 複数行にまたがる選択範囲のコメント切り替え
     * 選択範囲の先頭行と末尾行にコメントを追加または削除。
     * @param editor - エディターインスタンス
     * @param start - 選択範囲の開始位置
     * @param end - 選択範囲の終了位置
     */
    private toggleCommentForMultipleLines(editor: Editor, start: CodeMirror.Position, end: CodeMirror.Position): void {
        const { commentStart, commentEnd } = this.settings;
        const startLineText = editor.getLine(start.line);
        const endLineText = editor.getLine(end.line);

        const isCommented =
            startLineText.trim().startsWith(commentStart) && endLineText.trim().endsWith(commentEnd);

        if (isCommented) {
            // コメント解除
            editor.setLine(start.line, startLineText.replace(new RegExp(`^${commentStart}\\s*`), ""));
            editor.setLine(end.line, endLineText.replace(new RegExp(`\\s*${commentEnd}$`), ""));
            return;
        }

        // コメント追加
        editor.setLine(start.line, `${commentStart} ${startLineText}`);
        editor.setLine(end.line, `${endLineText} ${commentEnd}`);
    }

    /**
     * 単一行のコメント切り替え
     * コメントの開始部分と終了部分を条件に処理を分岐。
     * @param text - 対象の行または選択テキスト
     * @returns 処理後のテキスト
     */
    private toggleCommentForSingleLine(text: string): string {
        const { commentStart, commentEnd } = this.settings;
        const isCommented = text.trim().startsWith(commentStart) && text.trim().endsWith(commentEnd);

        return isCommented
            ? text.replace(new RegExp(`^${commentStart}\\s*`), "").replace(new RegExp(`\\s*${commentEnd}$`), "")
            : `${commentStart} ${text.trim()} ${commentEnd}`;
    }

    /* 設定をロード */
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    /* 設定を保存 */
    async saveSettings() {
        await this.saveData(this.settings);
    }

    /* プラグインのアンロード時に実行される処理 */
    onunload() {
        console.log("HTML Comment Plugin unloaded");
    }
}

/**
 * 設定画面
 * ユーザーがコメントの開始部分と終了部分をカスタマイズ可能にします。
 */
class HtmlCommentSettingTab extends PluginSettingTab {
    plugin: HtmlCommentPlugin;

    constructor(app: App, plugin: HtmlCommentPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        // 既存の内容をクリア
        containerEl.empty();
        containerEl.createEl("h2", { text: "HTML Comment Plugin Settings" });

        // コメント形式設定（開始部分と終了部分をまとめて設定）
        new Setting(containerEl)
            .setName("Comment Format")
            .setDesc("Set the start and end of the comment format (e.g., <!-- and -->).")
            .addTextArea((textarea) =>
                textarea
                    .setPlaceholder("Enter comment start and end, separated by a space")
                    .setValue(`${this.plugin.settings.commentStart} ${this.plugin.settings.commentEnd}`)
                    .onChange(async (value) => {
                        const [start, end] = value.split(" ");
                        this.plugin.settings.commentStart = start || DEFAULT_SETTINGS.commentStart;
                        this.plugin.settings.commentEnd = end || DEFAULT_SETTINGS.commentEnd;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
