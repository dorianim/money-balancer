use crate::services::group::{
    Group, GroupMember, GroupService, Transaction, TransactionCreationError,
};
use crate::services::user::User;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::Deserialize;
use rocket::*;

#[derive(Deserialize)]
struct GroupCreationRequest {
    name: String,
}

#[derive(Deserialize)]
struct TransactionCreationRequest {
    debtor_ids: Vec<String>,
    amount: u32,
    description: String,
}

#[get("/")]
async fn get_all_groups(
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Vec<Group>>, Status> {
    let group_service = group_service as &GroupService;
    Ok(Json(group_service.get_groups_of_user(user.id).await))
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

#[post("/<group_id>/member")]
async fn create_group_member(
    group_id: String,
    group_service: &State<GroupService>,
    user: User,
) -> Status {
    if !group_service
        .create_group_member(group_id, user.id, false)
        .await
    {
        return Status::BadRequest;
    }

    Status::Ok
}

#[post("/<group_id>/transaction", data = "<transaction_creation_request>")]
async fn create_group_tansaction(
    group_id: String,
    transaction_creation_request: Json<TransactionCreationRequest>,
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Transaction>, Status> {
    match group_service
        .create_transaction(
            group_id,
            user.id,
            transaction_creation_request.debtor_ids.to_owned(),
            transaction_creation_request.amount,
            transaction_creation_request.description.to_owned(),
        )
        .await
    {
        Ok(t) => Ok(Json(t)),
        Err(e) => match e {
            TransactionCreationError::GroupNotFound => Err(Status::NotFound),
            TransactionCreationError::DebtorNotInGroup => Err(Status::BadRequest),
        },
    }
}

pub fn routes() -> Vec<rocket::Route> {
    routes![
        get_all_groups,
        get_group,
        create_group,
        get_group_members,
        create_group_member,
        create_group_tansaction
    ]
}
