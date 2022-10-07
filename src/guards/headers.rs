use std::collections::HashMap;

use rocket::outcome::Outcome;
use rocket::request::{self, FromRequest, Request};

pub struct RequestHeaders {
    pub headers: HashMap<String, String>,
}

#[derive(Debug)]
pub enum HeaderError {}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for RequestHeaders {
    type Error = HeaderError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let headers = request
            .headers()
            .clone()
            .into_iter()
            .map(|header| {
                (
                    header.name.to_string().to_lowercase(),
                    header.value.to_string(),
                )
            })
            .collect::<HashMap<String, String>>();

        Outcome::Success(RequestHeaders {
            headers: headers.to_owned(),
        })
    }
}
