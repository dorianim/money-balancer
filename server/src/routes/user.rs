use crate::guards::authentication;
use crate::model::{group, group_member, prelude::*, user};
use pwhash::bcrypt;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::{Deserialize, Serialize};
use rocket::*;
use sea_orm::*;

#[derive(Deserialize)]
struct UserCreationRequest {
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
struct FullUser {
    id: String,
    username: String,
    nickname: String,
    groups: Vec<ReducedGroup>,
}

#[derive(Serialize)]
struct ReducedGroup {
    id: String,
    name: String,
}

#[derive(Serialize)]
struct TokenResponse {
    token: String,
}

#[get("/")]
async fn get_current_user(
    user: user::Model,
    db: &State<DatabaseConnection>,
) -> Result<Json<FullUser>, Status> {
    let db = db as &DatabaseConnection;

    let groups = get_groups_of_user(user.clone(), db).await;

    if let Err(err) = groups {
        println!("   >> ERROR loading groups: {:?}", err);
        return Err(Status::InternalServerError);
    }

    Ok(Json(FullUser {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        groups: groups.unwrap(),
    }))
}

#[post("/", data = "<user_creation_request>")]
async fn create_user(
    db: &State<DatabaseConnection>,
    user_creation_request: Json<UserCreationRequest>,
) -> Result<Json<FullUser>, Status> {
    let db = db as &DatabaseConnection;

    let new_user_id = uuid::Uuid::new_v4().to_string();

    let new_user = user::ActiveModel {
        id: ActiveValue::Set(new_user_id.to_owned()),
        username: ActiveValue::Set(user_creation_request.username.to_owned()),
        nickname: ActiveValue::Set(user_creation_request.nickname.to_owned()),
        password: ActiveValue::Set(
            bcrypt::hash(user_creation_request.password.to_string())
                .unwrap()
                .to_owned(),
        ),
    };

    User::insert(new_user)
        .exec(db)
        .await
        .map_err(|_| Status::Conflict)?;

    Ok(Json(FullUser {
        id: new_user_id,
        username: user_creation_request.username.to_string(),
        nickname: user_creation_request.nickname.to_string(),
        groups: Vec::new(),
    }))
}

#[post("/token", data = "<user_authentication_request>")]
async fn token(
    db: &State<DatabaseConnection>,
    user_authentication_request: Json<UserAuthenticationRequest>,
) -> Result<Json<TokenResponse>, Status> {
    let db = db as &DatabaseConnection;

    let user = User::find()
        .filter(user::Column::Username.eq(user_authentication_request.username.to_string()))
        .one(db)
        .await;

    match user {
        Ok(Some(user)) => {
            if bcrypt::verify(
                user_authentication_request.password.to_string(),
                &user.password,
            ) {
                Ok(Json(TokenResponse {
                    token: authentication::generate_jwt(&user),
                }))
            } else {
                Err(Status::Unauthorized)
            }
        }
        Ok(None) => Err(Status::Unauthorized),
        Err(_) => Err(Status::InternalServerError),
    }
}

async fn get_groups_of_user(
    user: user::Model,
    db: &DatabaseConnection,
) -> Result<Vec<ReducedGroup>, DbErr> {
    Ok(Vec::new())

    /*let groups = user
        .find_related(group_member::Entity)
        .find_also_related(group::Entity)
        .all(db)
        .await
        .expect("error loading groups")
        .into_iter()
        .map(|b| {
            let b = b.1.unwrap();
            ReducedGroup {
                id: b.id,
                name: b.name,
            }
        })
        .collect::<Vec<ReducedGroup>>();

    Ok(groups)*/
}

pub fn routes() -> Vec<rocket::Route> {
    routes![get_current_user, create_user, token]
}
