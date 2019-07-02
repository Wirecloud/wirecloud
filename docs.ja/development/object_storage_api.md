Object Storage は、ファイル、データベース、またはアーカイブが必要な他のデータセットであるデジタルオブジェクトの
永続ストレージを提供します。オブジェクトはコンテナと呼ばれる名前付きの場所に格納されます。コンテナはネストすることが
でき、オブジェクトは階層的に格納できます。

このセクションでは、ウィジェットまたはオペレータで使用できる WireCloud によって提供されるObjectStorage API
のリファレンス・ドキュメントを提供します。この API を使用できるようにするには、この API
の要件をウィジェット/オペレータの記述ファイルに追加する必要があります。この API の使用方法に関する詳細なドキュメント
および例については、[Using Object Storage](3.2.2_Using Object Storage) チュートリアルを参照してください。

## KeystoneAPI

次のコンストラクタを使用して、新しい **KeystoneAPI** をインスタンス化できます :

```javascript
KeystoneAPI(url[, options]);
```

-   `url` : キーストーン・サーバのURLです
-   `options`:
    -   `token` (String): Keystone サーバへのリクエストを認証するために使用するトークンです。_(オプション)_
    -   `use_user_fiware_token` (Boolean): **KeystoneAPI** が、FIWARE の IdM サーバから現在のユーザに対して
        WireCloud で取得したトークンを使用するようにします。`token` オプションよりも優先されます。_(オプション)_

`token` および `use_user_fiware_token` オプションは任意です。`KeystoneAPI` コンストラクタに渡されると、
これらの値は内部的に格納され、メソッドの呼び出し時にデフォルト値として使用されます。いずれの場合でも、
これらのオプションはデフォルト値を使用しない `KeystoneAPI` メソッドに渡すこともできます。


### getTenants

認証されたユーザに、使用可能な Keystone サーバ内のすべてのテナントを一覧表示します。

```javascript
getTenants([options]);
```

`onSuccess` コールバックは、最初の引数としてテナントのリストを受け取ります。


### getAuthToken

Object Storage API へのアクセスを許可する認証トークンを取得します。

```javascript
getAuthToken([options]);
```

その他のオプション :

-   `tenantName` (String): 生成されたトークンに関連付けるテナントの名前。`tenantId` と `tenantName`
    の両方の属性はオプションですが、一緒に指定することはできません
-   `tenantId` (String): 生成されたトークンに関連付けるテナントの id。`tenantId` と `tenantName`
    の両方の属性はオプションですが、一緒に指定することはできません

`onSuccess` コールバックは、最初の引数として認証トークンの情報を受け取ることになります。


## ObjectStorageAPI

新しい `ObjectStorageAPI` は、次のコンストラクタを使用して、インスタンス化できます :

```javascript
ObjectStorageAPI(url[, options]);
```

-   `url` : Object Storage サーバの URL です
-   `options`:
    -   `token` (String): Object Storage サーバへの認証リクエストのためにデフォルトで使用するトークンです

すべての `ObjectStorageAPI` メソッドは、少なくとも次のオプションをサポートします :

-   `token` (String): 認証リクエストに使用するトークン

および、次のコールバックがあります :

-   `onSuccess` は、リクエストが正常に終了すると呼び出されます。このコールバックに渡されるパラメータは、
    呼び出されるメソッドによって異なります
-   `onFailure` は、リクエストがエラーで終了したときに呼び出されます
-   `onComplete` は、リクエストが成功したかどうかにかかわらず、リクエストが完了したときに呼び出されます


### createContainer

他のコンテナやオブジェクトを格納できるコンテナを作成します。

```javascript
createContainer(container[, options]);
```

-   `container` は、作成するコンテナの名前です


### listContainer

コンテナの内容のリストを返します。

```javascript
listContainer(container[, options]);
```

-   `container` は、リストするコンテナの名前です


### deleteContainer

指定したコンテナをストレージ・システムから削除します。

```javascript
deleteContainer(container[, options]);
```

-   `container` は、削除するコンテナの名前です


### getFile

ストレージ・システムから指定されたオブジェクトを取得します。

```javascript
getFile(container, file_name[, options])
```

-   `container` は、ファイルが存在するコンテナの名前です
-   `file_name` は、ダウンロードするファイルの名前です

その他のオプション :

-   `response_type` (String, default : "blob") : 有効な値はすべて `responseType` オプションでサポートされています。
    "" を除きます。詳細は[リクエスト・オプション](../widgetapi/widgetapi.md#request-options-general-options)
    のセクションを参照してください


### uploadFile

バイナリオブジェクトを指定された場所に格納します。

```javascript
uploadFile(container, file[, options]);
```

-   `container` は、ファイルがアップロードされるコンテナの名前です
-   `file` は、アップロードするコンテンツです。[Blob](https://developer.mozilla.org/en/docs/Web/API/Blob) または
    [File](https://developer.mozilla.org/en/docs/Web/API/File) のインスタンスである必要があります

その他のオプション : 

-   `file_name` : ファイルのアップロードに使用する名前。このオプションは、`file` の引き数として `Blob`
    を渡す場合に必要です。このオプションは、その `name` 属性から名前を取得するときに `File` インスタンスを渡すときには
    必要ありません。とにかく、このオプションで渡された名前は、`File` インスタンスの `name` 属性よりも優先されます


### deleteFile

指定されたオブジェクトをストレージシステムから削除します。

```javascript
deleteFile(container, file_name[, options]);
```

-   `container` は、ファイルが削除されるコンテナの名前です
-   `file_name` は、削除するファイルの名前です
