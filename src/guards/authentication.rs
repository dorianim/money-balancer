use crate::services;
use crate::services::authentication::{AuthenticationError, AuthenticationService};
use crate::services::user::UserService;
use rocket::http::Status;
use rocket::outcome::Outcome;
use rocket::request::{self, FromRequest, Request};

#[rocket::async_trait]
impl<'r> FromRequest<'r> for services::user::User {
    type Error = AuthenticationError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let user_service = request.rocket().state::<UserService>().unwrap();
        let authentication_service = request.rocket().state::<AuthenticationService>().unwrap();
        let tokens: Vec<_> = request.headers().get("authorization").collect();

        if tokens.len() != 1 {
            return Outcome::Failure((Status::Unauthorized, AuthenticationError::MissingToken));
        }

        let token = tokens.get(0).unwrap().to_string().replace("Bearer ", "");

        let claims = authentication_service.validate_jwt(token).await;

        if let Err(e) = claims {
            println!("   >> Error validating token: {}", e);
            return Outcome::Failure((Status::Unauthorized, AuthenticationError::InvalidToken));
        }

        let user = user_service.get_user_by_id(claims.unwrap().id).await;

        if let Err(_) = user {
            return Outcome::Failure((Status::Unauthorized, AuthenticationError::InvalidToken));
        }

        Outcome::Success(user.unwrap())
    }
}
