use crate::services::group::{Group, GroupMember, GroupService};
use crate::services::user::User;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::Deserialize;
use rocket::*;
#[derive(Deserialize)]
struct GroupCreationRequest {
    name: String,
}

#[get("/")]
async fn get_all_groups(
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Vec<Group>>, Status> {
    let group_service = group_service as &GroupService;
    Ok(Json(group_service.get_groups_of_user(user).await))
}

#[get("/<group_id>")]
async fn get_group(
    group_id: String,
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Group>, Status> {
    match group_service.get_group_of_user(group_id, user.id).await {
        None => Err(Status::NotFound),
        Some(group) => Ok(Json(group)),
    }
}

#[get("/<group_id>/member")]
async fn get_group_members(
    group_id: String,
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Vec<GroupMember>>, Status> {
    match group_service
        .get_members_of_group_of_user(group_id, user.id)
        .await
    {
        None => Err(Status::NotFound),
        Some(members) => Ok(Json(members)),
    }
}

#[post("/", data = "<group_creation_request>")]
async fn create_group(
    group_service: &State<GroupService>,
    user: User,
    group_creation_request: Json<GroupCreationRequest>,
) -> Json<Group> {
    let group_service = group_service as &GroupService;

    Json(
        group_service
            .create_group(group_creation_request.name.to_owned(), user)
            .await,
    )
}

pub fn routes() -> Vec<rocket::Route> {
    routes![get_all_groups, get_group, get_group_members, create_group]
}
