use crate::services::user::{FullUser, UserService};
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

#[get("/")]
async fn get_current_user(user: FullUser) -> Result<Json<FullUser>, Status> {
    Ok(Json(user))
}

#[post("/", data = "<user_creation_request>")]
async fn create_user(
    user_service: &State<UserService>,
    user_creation_request: Json<UserCreationRequest>,
) -> Result<Json<FullUser>, Status> {
    let user_service = user_service as &UserService;
    let res = user_service
        .create_user(
            user_creation_request.username.to_owned(),
            user_creation_request.nickname.to_owned(),
            user_creation_request.password.to_owned(),
        )
        .await;

    match res {
        Ok(u) => Ok(Json(u)),
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
