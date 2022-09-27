use rocket::*;

use rocket::http::ContentType;
use rust_embed::RustEmbed;
use std::{borrow::Cow, path::PathBuf};

use std::ffi::OsStr;

#[derive(RustEmbed)]
#[folder = "client/build"]
struct ClientAssets;

fn get_client_file(file: PathBuf) -> Option<(ContentType, Cow<'static, [u8]>)> {
    let filename = file.display().to_string();
    let asset = ClientAssets::get(&filename)?;
    let content_type = file
        .extension()
        .and_then(OsStr::to_str)
        .and_then(ContentType::from_extension)
        .unwrap_or(ContentType::Bytes);

    Some((content_type, asset.data))
}

#[get("/")]
fn index() -> Option<(ContentType, Cow<'static, [u8]>)> {
    get_client_file(PathBuf::from("index.html"))
}

#[get("/<file>")]
fn client_root(file: PathBuf) -> Option<(ContentType, Cow<'static, [u8]>)> {
    get_client_file(file)
}

#[get("/static/<file..>")]
fn client_static(file: PathBuf) -> Option<(ContentType, Cow<'static, [u8]>)> {
    get_client_file(PathBuf::from(
        "static/".to_string() + &file.display().to_string(),
    ))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![index, client_root, client_static]
}
