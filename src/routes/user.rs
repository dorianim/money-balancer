use crate::services::group::{Group, GroupService};
use crate::services::user::{User, UserService};
use ::serde::{Deserialize, Serialize};
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::*;

#[derive(Deserialize, Serialize)]
pub struct UserCreationRequest {
    username: String,
    nickname: String,
    password: String,
}

#[derive(Deserialize, Serialize)]
struct UserAuthenticationRequest {
    username: String,
    password: String,
}

#[derive(Serialize, Deserialize)]
struct TokenResponse {
    token: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FullUser {
    pub id: String,
    pub username: String,
    pub nickname: String,
    pub groups: Vec<Group>,
}

#[async_trait]
trait UserToFullUser {
    async fn to_full_user(self: Self, service: &GroupService) -> FullUser;
}

#[async_trait]
impl UserToFullUser for User {
    async fn to_full_user(self, service: &GroupService) -> FullUser {
        FullUser {
            id: self.id.to_owned(),
            username: self.username.to_owned(),
            nickname: self.nickname.to_owned(),
            groups: service.get_groups_of_user(self.id).await,
        }
    }
}

#[get("/")]
async fn get_current_user(
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<FullUser>, Status> {
    let group_service = group_service as &GroupService;
    Ok(Json(user.to_full_user(group_service).await))
}

#[post("/", data = "<user_creation_request>")]
async fn create_user(
    user_service: &State<UserService>,
    group_service: &State<GroupService>,
    user_creation_request: Json<UserCreationRequest>,
) -> Result<Json<FullUser>, Status> {
    let user_service = user_service as &UserService;
    let group_service = group_service as &GroupService;
    let res = user_service
        .create_user(
            user_creation_request.username.to_owned(),
            user_creation_request.nickname.to_owned(),
            user_creation_request.password.to_owned(),
        )
        .await;

    match res {
        Ok(u) => Ok(Json(u.to_full_user(group_service).await)),
        Err(_) => Err(Status::Conflict),
    }
}

#[post("/token", data = "<user_authentication_request>")]
async fn token(
    user_service: &State<UserService>,
    user_authentication_request: Json<UserAuthenticationRequest>,
) -> Result<Json<TokenResponse>, Status> {
    let user_service = user_service as &UserService;
    let res = user_service
        .create_user_token(
            user_authentication_request.username.to_owned(),
            user_authentication_request.password.to_owned(),
        )
        .await;

    match res {
        Ok(token) => Ok(Json(TokenResponse { token })),
        Err(()) => Err(Status::Unauthorized),
    }
}

pub fn routes() -> Vec<rocket::Route> {
    routes![get_current_user, create_user, token]
}

#[cfg(test)]
mod tests {
    use std::env;

    use crate::build_test_rocket;
    use crate::routes::user::{FullUser, TokenResponse};
    use rocket::http::Status;
    use rocket::local::blocking::Client;
    use serial_test::serial;

    pub fn create_user(client: &Client, username: &str) -> Result<FullUser, Status> {
        let user_creation_request = super::UserCreationRequest {
            username: username.to_owned(),
            nickname: username.to_uppercase(),
            password: username.to_owned(),
        };
        let request = client
            .post("/user")
            .body(rocket::serde::json::to_string(&user_creation_request).expect(""));
        let response = request.clone().dispatch();

        if response.status() != Status::Ok {
            return Err(response.status());
        }

        let resp: FullUser =
            rocket::serde::json::from_str(response.into_string().unwrap().as_str()).unwrap();
        Ok(resp)
    }

    pub fn create_token(client: &Client, username: &str, password: &str) -> Result<String, Status> {
        env::set_var("JWT_SECRET", "secret");
        let user_authentication_request = super::UserAuthenticationRequest {
            username: username.to_owned(),
            password: password.to_owned(),
        };
        let request = client
            .post("/user/token")
            .body(rocket::serde::json::to_string(&user_authentication_request).expect(""));
        let response = request.clone().dispatch();

        if response.status() != Status::Ok {
            return Err(response.status());
        }

        let resp: TokenResponse =
            rocket::serde::json::from_str(response.into_string().unwrap().as_str()).unwrap();

        Ok(resp.token)
    }

    #[test]
    #[serial]
    fn test_create_user() {
        let client = Client::tracked(build_test_rocket()).expect("valid rocket instance");
        let response = create_user(&client, "alice").expect("");
        assert_eq!(response.nickname, "ALICE");
        assert_eq!(response.username, "alice");
        assert_eq!(response.groups.len(), 0);

        let response = create_user(&client, "alice");
        assert!(if let Err(e) = response {
            e == Status::Conflict
        } else {
            false
        });
    }

    #[test]
    #[serial]
    fn test_create_token() {
        let client = Client::tracked(build_test_rocket()).expect("valid rocket instance");

        let user = create_user(&client, "alice").expect("user to be created");
        let response = create_token(&client, &user.username, &user.username);
        assert!(!response.is_err());

        let response = create_token(&client, "alice", "wrong-password");
        assert!(response.is_err());

        let response = create_token(&client, "does-not-exist", "");
        assert!(response.is_err());
    }
}
