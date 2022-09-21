use crate::model::{prelude::*, user};
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use rocket::http::Status;
use rocket::outcome::Outcome;
use rocket::request::{self, FromRequest, Request};
use rocket::serde::{Deserialize, Serialize};
use sea_orm::{DatabaseConnection, EntityTrait};

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtClaims {
    id: String,
    iss: String,
    exp: usize,
}

#[derive(Debug)]
pub enum JwtError {
    InvalidToken,
    MissingToken,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for user::Model {
    type Error = JwtError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let db = request.rocket().state::<DatabaseConnection>();
        let tokens: Vec<_> = request.headers().get("authorization").collect();

        if tokens.len() != 1 {
            return Outcome::Failure((Status::Unauthorized, JwtError::MissingToken));
        }

        let token = tokens.get(0).unwrap().to_string().replace("Bearer ", "");

        match validate_jwt(db.unwrap(), token).await {
            Ok(user) => Outcome::Success(user),
            Err(_) => Outcome::Failure((Status::Unauthorized, JwtError::InvalidToken)),
        }
    }
}

pub async fn validate_jwt(db: &DatabaseConnection, token: String) -> Result<user::Model, Status> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&["de:itsblue:money-balancer"]);
    validation.validate_exp = false;

    let token = jsonwebtoken::decode::<JwtClaims>(
        &token,
        &DecodingKey::from_secret(get_secret().as_bytes()),
        &validation,
    );

    if let Err(err) = token {
        println!("   >> ERROR decoding token: {:?}", err);
        return Err(Status::Unauthorized);
    }

    let user = User::find_by_id(token.unwrap().claims.id)
        .one(db)
        .await
        .expect("Failed to query user!");

    if let None = user {
        return Err(Status::Unauthorized);
    }

    Ok(user.unwrap())
}

pub fn generate_jwt(user: &user::Model) -> String {
    let jwt = jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &JwtClaims {
            id: user.id.to_string(),
            iss: "de:itsblue:money-balancer".to_string(),
            exp: 0,
        },
        &jsonwebtoken::EncodingKey::from_secret(get_secret().as_bytes()),
    );

    jwt.unwrap()
}

fn get_secret() -> String {
    let result = std::env::var("JWT_SECRET");
    if let Ok(secret) = result {
        return secret;
    }

    return uuid::Uuid::new_v4().to_string();
}
