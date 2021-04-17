# WireCloud への貢献

WireCloud に何か貢献したいですか？ **手助けをする方法は次のとおりです**。

関与するすべての人にコントリビューション・プロセスを簡単かつ効果的にさせるために、このドキュメントを是非ご覧ください。

これらのガイドラインに従って、このオープンソース・プロジェクトを管理し開発する開発者の時間を尊重していることを
伝えるのにちます。その代わりに、彼らはあなたの問題に対処するか、パッチと機能を評価することにその敬意を払うべきです。

**内容**

-   [基本ルールと期待](#ground-rules--expectations)
-   [Issue トラッカーの使用](#using-the-issue-tracker)
-   [バグ・レポート](#bug-reports)
-   [機能リクエスト](#feature-requests)
-   [コントリビューションするコード](#contributing-code)
    -   [コード・ガイドライン](#code-guidelines)
    -   [コード・スタイル git hooks](#code-style-git-hooks)
-   [コミュニティ](#community)


<a name="ground-rules--expectations"></a>
## 基本ルールと期待

始める前に、ここに私たちがあなたに期待するいくつかのことを示します (そしてあなたが他の人に期待すべきこと):

-   このプロジェクトに関する会話には、親切で思慮深くしてください。私たちは皆、さまざまなバックグラウンドとプロジェクト
    から来ています。つまり、"オープンソースがどのように行われるか"についてさまざまな見方をしている可能性があります。
    あなたのやり方が正しいことを彼らに納得させるのではなく、他の人の話を聞くようにしてください
-   このプロジェクトは、[Contributor Code of Conduct](./CODE_OF_CONDUCT.md)とともにリリースされます。このプロジェクトに
    参加することにより、あなたはその条件に従うことに同意するものとします。
-   プル・リクエストを開く場合は、_"I have read the CLA Document and I hereby sign the CLA"_ とコメントを記載して、
    [Individual Contributor License Agreement](https://fiware.github.io/contribution-requirements/individual-cla.pdf)
    に署名する必要があります
-   あなたの貢献がすべてのテストに合格することを確認してください。テストが失敗した場合は、貢献をマージする前にそれらに
    対処する必要があります。
-   コンテンツを追加するときは、それが広く価値があるかどうかを考慮してください。 あなたやあなたの雇用主が作成したもの
    への参照やリンクを追加しないでください。他の人がそれを高く評価した場合にそうします。

<a name="using-the-issue-tracker"></a>
## Issue トラッカーの使用

[Issue トラッカー](https://github.com/Wirecloud/wirecloud/issues)は[バグ・レポート](#bug-reports)や
[機能リクエスト](#feature-requests)の優先チャンネルですが、以下の制限事項を守ってください :

-   個人的なサポート要求には Issue トラッカーを使用しないでください。スタック・オーバーフロー
    ([`fiware-wirecloud`](http://stackoverflow.com/questions/tagged/fiware-wirecloud)) は助けを得るのに良い場所です :

-   脱線やトラブルを起こさないでください。トピックについての議論を維持し、他者の意見を尊重してください


<a name="bug-reports"></a>
## バグ・レポート

バグは、リポジトリ内のコードによって引き起こされる_実証可能な問題_です。良いバグレポートはとても役に立ちます。
ご協力をお願いします。

バグ・レポートのガイドライン：

1. **GitHub のIssue 検索を使用します** - 問題が既に報告されているかどうかを確認します

2. **問題が修正されているかどうかを確認します** - リポジトリの最新 `master` または開発ブランチを
   使用して問題を再現してください

3. **問題を切り分けます** - 理想的には、[縮小されたテスト・ケース](http://css-tricks.com/6263-reduced-test-cases/)
   と実際の例を作成します

良いバグレポートは、他の人があなたを追いかける必要のある情報を残すべきではありません。レポートにできるだけ詳しく
記述してください。あなたの環境は何ですか？どのような手順で問題が再現されますか？どのブラウザと OS で問題が
発生していますか？他のブラウザはバグの表示方法が異なりますか？どのような結果が期待されますか？これらの詳細は、
潜在的なバグを修正するのに役立ちます。

例:

> 短い記述的な例のバグレポートのタイトル
>
> Issue の概要とそれが発生したブラウザ/ OS 環境。適切な場合は、バグを再現するのに必要な手順を含めてください。
>
> 1. これが最初のステップです
> 2. これが第2のステップです
> 3. さらなるステップなど
>
> `<url>` - 縮小されたテストケースへのリンク
>
> 共有したいその他の情報は、レポートされる Issue に関連しています。これには、バグの原因となったコード行と、
> 潜在的な解決策、および、そのメリットに関するあなたの意見が含まれます。


<a name="feature-requests"></a>
## 機能リクエスト

機能のリクエストは大歓迎です。しかし、あなたのアイデアがプロジェクトの範囲と目的に合っているかどうかを確認するために、
少し時間をかけてください。それはあなた次第です。この機能のメリットのプロジェクトの開発者を納得させるために
強力なケースを作ることですできるだけ詳細とコンテキストを提供してください。


<a name="contributing-code"></a>
## コントリビューションするコード

いくつかのコード/ドキュメントをコントリビューションする準備ができている場合、プロセスは次のようになります :

-   あなたのアカウントに GitHub のプロジェクトをフォークします
-   WireCloud のコピーをクローンします
-   git で新しいブランチを作成し、そこに変更をコミットします
-   新しいブランチを GitHub にプッシュします
-   再度、Issue がないか、プルリクエストがあるかを確認します。より良い解決策があると思われる場合は、Issue 番号を
    書き留めて、プルリクエストに記載してください
-   問題/機能の内容、ソフトウェアのバージョン、関連する Issue/プルリクエストの参照など、ブランチに基づいて、
    新しいプルリクエストを作成します

WireCloud にマージするには、コントリビューションは可能な限り次の推奨事項に従うべきです：

-   よいパッチは、
    -   クリアです
    -   Python/Django のサポートされているすべてのバージョンで動作します。
        [テストに関するドキュメント](development/platform/testing.md)を見てください
    -   [コードのガイドライン](#code-guidelines)に従っています
    -   コメントは必要に応じて含まれています
-   以前に含まれていたパッチで不具合が確認されたテストケース
-   public API を追加/変更する場合は、その変更に関するドキュメントも含める必要があります

作業コピーのソースコード・リポジトリから WireCloud を直接実行することで、手動で変更をテストすることができます。
提供された `settings.py` ファイルは共有セキュリティ・キーと基本的な設定、例えば、`sqlite3` を使用するため、
本番環境では使用できませんが、簡単な手動テストに使用できます。それは守らなければならないステップです :

```bash
#
# Download your WireCloud repository
#

git clone https://github.com/${your_username}/wirecloud.git


#
# Enter into the source folder
#

cd wirecloud/src


#
# Install basic dependencies (see the installation guide, here are the ones for
# Debian/Ubuntu)
#

apt-get update
apt-get install python python-pip --no-install-recommends
apt-get install build-essential python-dev libxml2-dev libxslt1-dev zlib1g-dev libpcre3-dev libcurl4-openssl-dev libjpeg-dev
pip install -U pip setuptools


#
# Install WireCloud dependencies and WireCloud itself in development mode
#

python setup.py develop


#
# Install extra dependencies
#

pip install django-nose "mock>=1.0,<2.0"


#
# Init db
#

python manage.py migrate
python manage.py createsuperuser


#
# Execute the develpment server
#

python manage.py runserver


#
# Point your browser to http://localhost:8000
#
```


<a name="code-guidelines"></a>
### コード・ガイドライン

#### Python

-   [PEP 8 スタイルのルール](https://www.python.org/dev/peps/pep-0008/)に従います
-   [`flake8`](http://flake8.pycqa.org/en/latest/) を使用します。
    または、代替として、`pep8` および `pyflakes` を組み合わせて使用します

#### JavaScript

-   インデント用に4つのスペースがあり、タブではありません
-   厳格なモード
-   魅力的
-   [`eslint`](http://eslint.org/) を使用する。WireCloud のソースコードに `.eslintrc` ファイルがあります;-)

#### HTML

-   インデント用に4つのスペースがあり、タブでありません
-   二重引用符のみで、一重引用符は使用できません
-   常に適切なインデントを使用してください
-   XHTML5 の doctype に適したタグ (例えば、自己閉じタグ) と要素を使用してください

#### SCSS

-   複数行アプローチ、1行に1つのプロパティと値
-   常にプロパティのコロンの後のスペース。例えば、`display: block;` で `display:block;` ではありません
-   すべての行をセミコロンで終了します
-   アトリビュート・セレクタは、`input[type="text"]` のように、一貫性と安全性のために、アトリビュートの値を
    二重引用符で囲む必要があります。XSS 攻撃につながる可能性のある引用されていないアトリビュート値については、
    この[ブログ記事](http://mathiasbynens.be/notes/unquoted-attribute-values)を参照してください
-   アトリビュート・セレクタは、フォームコントロールなど、絶対に必要な場所でのみ使用するようにしてください。
    また、カスタム・コンポーネントではパフォーマンスと説明を避けるべきです
-   コンポーネントの一連のクラスは、基本クラス (例えば、`.component`) を含まれていなければならず、
    基本クラスを、プレフィックスおよびサブ・コンポーネント (例えば、`.component-lg`) として使用する必要があります
-   継承とネストを超えを避け、可能な限り、単一の明示的なクラスを使用します
-   実行可能な場合、デフォルトのカラーパレットは、
    [WCAG カラー・コントラスト・ガイドライン](http://www.w3.org/TR/WCAG20/#visual-audio-contrast)
    に準拠する必要があります
-   まれな場合を除いて、代替スタイルを提供せずにデフォルト `:focus` スタイル (例：`outline: none;` を経由) を
    削除しないでください。詳細は、この [A11Yプロジェクトの記事](http://a11yproject.com/posts/never-remove-css-outlines/)
    を参照してください

<a name="code-style-git-hooks"></a>
### コード・スタイル git hooks

WireCloud リポジトリは git hooks を使用して自動コード・スタイル検証を提供するための  `pre-commit` 設定ファイルを提供
します。現在、この検証は JavaScript および Python コード用に構成されています。

最初に pre-commit をシステムにインストールする必要があります。詳細な情報については、[pre-commit](https://pre-commit.com/#intro)
Web サイトを参照できます。基本的なシナリオでは、次のコマンドを実行してインストールできます :

```
pip install pre-commit
```

インストールしたら、ターミナルで次を実行してワーキング・コピーに git hooks をインストールできます :

```
pre-commit install
```

これで、`git commit` で `pre-commit` が自動的に実行されます!

<a name="community"></a>
## コミュニティ

オープンソース・ガイドに関する議論は、このリポジトリの
[イシュー](https://github.com/Wirecloud/wirecloud/issues) と [プル・リクエスト](https://github.com/Wirecloud/wirecloud/pulls)
セクションで行われます。どなたでもこれらの会話に参加できます。

可能な限り、メンテナに直接連絡するなど、これらの会話をプライベート・チャネルに持ち込まないでください。コミュニケーションを
公開し続けることは、誰もが会話から利益を得て学ぶことができることを意味します。
