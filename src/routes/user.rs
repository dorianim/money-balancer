use crate::services::authentication::AuthenticationService;
use crate::services::configuration::ConfigurationService;
use crate::services::group::{Group, GroupService};
use crate::services::user::{User, UserService};
use ::serde::{Deserialize, Serialize};
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::*;
use std::sync::Arc;

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
    user_service: &State<Arc<UserService>>,
    configuration_service: &State<Arc<ConfigurationService>>,
    group_service: &State<GroupService>,
    user_creation_request: Json<UserCreationRequest>,
) -> Result<Json<FullUser>, Status> {
    if configuration_service.auth_local().is_none() {
        return Err(Status::Forbidden);
    }

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
    authentication_service: &State<Arc<AuthenticationService>>,
    user_authentication_request: Json<UserAuthenticationRequest>,
) -> Result<Json<TokenResponse>, Status> {
    let res = authentication_service
        .authenticate_local(
            &user_authentication_request.username,
            &user_authentication_request.password,
        )
        .await;

    match res {
        Some(token) => Ok(Json(TokenResponse { token })),
        None => Err(Status::Unauthorized),
    }
}

pub fn routes() -> Vec<rocket::Route> {
    routes![get_current_user, create_user, token]
}

#[cfg(test)]
mod tests {
    use crate::build_test_rocket;
    use crate::routes::user::{FullUser, TokenResponse};
    use rocket::http::{ContentType, Status};
    use rocket::local::asynchronous::Client;

    pub async fn create_user(client: &Client, username: &str) -> Result<FullUser, Status> {
        let user_creation_request = super::UserCreationRequest {
            username: username.to_owned(),
            nickname: username.to_uppercase(),
            password: username.to_owned(),
        };
        let response = client
            .post("/api/v1/user/")
            .header(ContentType::JSON)
            .body(rocket::serde::json::to_string(&user_creation_request).expect(""));
        let response = response.dispatch().await;

        if response.status() != Status::Ok {
            return Err(response.status());
        }

        let response_body = response.into_string().await.unwrap();
        let resp: FullUser = rocket::serde::json::from_str(response_body.as_str()).unwrap();
        Ok(resp)
    }

    pub async fn create_token(
        client: &Client,
        username: &str,
        password: &str,
    ) -> Result<String, Status> {
        let user_authentication_request = super::UserAuthenticationRequest {
            username: username.to_owned(),
            password: password.to_owned(),
        };
        let response = client
            .post("/api/v1/user/token")
            .header(ContentType::JSON)
            .body(rocket::serde::json::to_string(&user_authentication_request).expect(""));
        let response = response.dispatch().await;

        if response.status() != Status::Ok {
            return Err(response.status());
        }

        let response_body = response.into_string().await.unwrap();
        let resp: TokenResponse = rocket::serde::json::from_str(response_body.as_str()).unwrap();

        Ok(resp.token)
    }

    #[rocket::async_test]
    async fn test_create_user() {
        let client = Client::tracked(build_test_rocket().await)
            .await
            .expect("valid rocket instance");
        let response = create_user(&client, "alice").await.expect("");
        assert_eq!(response.nickname, "ALICE");
        assert_eq!(response.username, "alice");
        assert_eq!(response.groups.len(), 0);

        let response = create_user(&client, "alice").await;
        assert!(if let Err(e) = response {
            e == Status::Conflict
        } else {
            false
        });
    }

    #[rocket::async_test]
    async fn test_create_token() {
        let client = Client::tracked(build_test_rocket().await)
            .await
            .expect("valid rocket instance");

        let user = create_user(&client, "alice")
            .await
            .expect("user to be created");
        let response = create_token(&client, &user.username, &user.username).await;
        assert!(response.is_ok());

        let response = create_token(&client, "alice", "wrong-password").await;
        assert!(response.is_err());

        let response = create_token(&client, "does-not-exist", "").await;
        assert!(response.is_err());
    }
}
