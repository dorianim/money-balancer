use crate::guards;
use crate::services::authentication::AuthenticationService;
use ::serde::{Deserialize, Serialize};
use rocket::http::Status;
use rocket::response::Redirect;
use rocket::serde::json::Json;
use rocket::*;
use std::sync::Arc;

#[derive(Serialize)]
struct AvailableProviders {
    local: PublicLocalConfig,
    proxy: PublicProxyConfig,
}

#[derive(Serialize, Deserialize)]
struct TokenResponse {
    token: String,
}

// == local provider ==
#[derive(Serialize)]
struct PublicLocalConfig {
    enabled: bool,
}

#[derive(Deserialize, Serialize)]
struct LocalRequest {
    username: String,
    password: String,
}

// == proxy provider ==
#[derive(Serialize)]
struct PublicProxyConfig {
    enabled: bool,
}

#[get("/")]
async fn available_providers(
    authentication_service: &State<Arc<AuthenticationService>>,
) -> Json<AvailableProviders> {
    Json(AvailableProviders {
        local: PublicLocalConfig {
            enabled: authentication_service.local_enabled(),
        },
        proxy: PublicProxyConfig {
            enabled: authentication_service.proxy_enabled(),
        },
    })
}

#[post("/local", data = "<local_request>")]
async fn local(
    local_request: Json<LocalRequest>,
    authentication_service: &State<Arc<AuthenticationService>>,
) -> Result<Json<TokenResponse>, Status> {
    let res = authentication_service
        .authenticate_local(&local_request.username, &local_request.password)
        .await;

    match res {
        Some(token) => Ok(Json(TokenResponse { token })),
        None => Err(Status::Unauthorized),
    }
}

#[get("/proxy")]
async fn proxy_redirect() -> Redirect {
    Redirect::to(uri!("/#/login/proxy"))
}

#[post("/proxy")]
async fn proxy(
    request_headers: guards::headers::RequestHeaders,
    authentication_service: &State<Arc<AuthenticationService>>,
) -> Result<Json<TokenResponse>, Status> {
    let res = authentication_service
        .authenticate_proxy(request_headers.headers)
        .await;

    match res {
        Some(token) => Ok(Json(TokenResponse { token })),
        None => Err(Status::Unauthorized),
    }
}

pub fn routes() -> Vec<rocket::Route> {
    routes![available_providers, local, proxy, proxy_redirect]
}
