use crate::services;
use crate::services::user::UserService;
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use rocket::http::Status;
use rocket::outcome::Outcome;
use rocket::request::{self, FromRequest, Request};
use rocket::serde::{Deserialize, Serialize};

#[derive(Debug)]
pub enum JwtError {
    InvalidToken,
    MissingToken,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtClaims {
    id: String,
    iss: String,
    exp: usize,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for services::user::User {
    type Error = JwtError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let user_service = request.rocket().state::<UserService>().unwrap();
        let tokens: Vec<_> = request.headers().get("authorization").collect();

        if tokens.len() != 1 {
            return Outcome::Failure((Status::Unauthorized, JwtError::MissingToken));
        }

        let token = tokens.get(0).unwrap().to_string().replace("Bearer ", "");

        let claims = validate_jwt(token).await;

        if let Err(e) = claims {
            println!("   >> Error validating token: {}", e);
            return Outcome::Failure((Status::Unauthorized, JwtError::InvalidToken));
        }

        let user = user_service.get_user_by_id(claims.unwrap().id).await;

        if let Err(_) = user {
            return Outcome::Failure((Status::Unauthorized, JwtError::InvalidToken));
        }

        Outcome::Success(user.unwrap())
    }
}

pub async fn validate_jwt(token: String) -> Result<JwtClaims, jsonwebtoken::errors::Error> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&["de:itsblue:money-balancer"]);
    validation.validate_exp = false;

    let token = jsonwebtoken::decode::<JwtClaims>(
        &token,
        &DecodingKey::from_secret(get_secret().as_bytes()),
        &validation,
    )?;

    Ok(token.claims)
}

pub fn generate_jwt(user_id: String) -> String {
    let jwt = jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &JwtClaims {
            id: user_id.to_owned(),
            iss: "de:itsblue:money-balancer".to_string(),
            exp: 0,
        },
        &jsonwebtoken::EncodingKey::from_secret(get_secret().as_bytes()),
    );

    jwt.unwrap()
}

fn get_secret() -> String {
    let result = std::env::var("JWT_SECRET");
    result.unwrap()
}
