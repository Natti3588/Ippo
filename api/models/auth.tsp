namespace Ippo;

@doc("サインアップリクエスト")
model SignUpRequest {
  @doc("サインアップに使うメールアドレス")
  @format("email")
  email: string;

  @doc("サインアップに使うパスワード")
  @minLength(8)
  @maxLength(72)
  password: string;

  @doc("サインアップに使う名前")
  @minLength(1)
  @maxLength(50)
  displayName: string;
}

@doc("ログインリクエスト")
model LoginRequest {
  @doc("ログインに使うメールアドレス")
  @format("email")
  email: string;

  @doc("ログインに使われるパスワード")
  password: string;
}

@doc("ログイン中のユーザーの情報")
model CurrentUser {
  @doc("ログインに使うメールアドレス")
  @format("email")
  email: string;

  @doc("投稿に使われる名前")
  displayName: string;
}

@doc("ユーザー情報変更")
model UpdateProfileRequest {
  @doc("ユーザー情報変更に使われる名前")
  @minLength(1)
  @maxLength(50)
  displayName: string;
}
