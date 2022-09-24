use crate::services::group::{Group, GroupService};
use crate::services::user::{User, UserService};
use ::serde::{Deserialize, Serialize};
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::*;

#[derive(Deserialize)]
pub struct UserCreationRequest {
    username: String,
    nickname: String,
    password: String,
}

#[derive(Deserialize)]
struct UserAuthenticationRequest {
    username: String,
    password: String,
}

#[derive(Serialize)]
struct TokenResponse {
    token: String,
}

#[derive(Serialize)]
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
            groups: service.get_groups_of_user(self).await,
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
