use rocket::*;

use rocket::http::ContentType;
use rust_embed::RustEmbed;
use std::borrow::Cow;

#[derive(RustEmbed)]
#[folder = "src/resources/api"]
#[prefix = "swagger/"]
struct SwaggerAssets;

#[get("/")]
async fn swagger() -> (ContentType, Cow<'static, [u8]>) {
    (
        ContentType::HTML,
        SwaggerAssets::get("swagger/swagger.html").unwrap().data,
    )
}

#[get("/openapi.yaml")]
async fn openapi() -> (ContentType, Cow<'static, [u8]>) {
    (
        ContentType::Text,
        SwaggerAssets::get("swagger/openapi.yaml").unwrap().data,
    )
}

pub fn routes() -> Vec<rocket::Route> {
    routes![swagger, openapi]
}
