use crate::services::group::{
    Debt, Group, GroupMember, GroupService, Transaction, TransactionCreationError,
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
struct AmountTransactionCreationRequest {
    debtor_ids: Vec<String>,
    amount: u32,
    description: String,
}

#[derive(Deserialize)]
struct DebtsTransactionCreationRequest {
    debts: Vec<Debt>,
    description: String,
}

#[derive(Deserialize)]
enum TransactionCreationRequest {
    Debts(DebtsTransactionCreationRequest),
    Amount(AmountTransactionCreationRequest),
}

#[get("/")]
async fn get_all_groups(
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Vec<Group>>, Status> {
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

#[get("/<group_id>/transaction")]
async fn get_group_transactions(
    group_id: String,
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Vec<Transaction>>, Status> {
    match group_service
        .get_transactions_of_group_of_user(group_id, user.id)
        .await
    {
        Some(t) => Ok(Json(t)),
        None => Err(Status::NotFound),
    }
}

#[post("/<group_id>/transaction", data = "<transaction_creation_request>")]
async fn create_group_tansaction(
    group_id: String,
    transaction_creation_request: Json<TransactionCreationRequest>,
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Transaction>, Status> {
    let res = match transaction_creation_request.0 {
        TransactionCreationRequest::Amount(r) => {
            group_service
                .create_transaction_from_amount(
                    &group_id,
                    user.id,
                    r.debtor_ids,
                    r.amount,
                    r.description,
                )
                .await
        }
        TransactionCreationRequest::Debts(r) => {
            group_service
                .create_transaction_from_debts(&group_id, user.id, r.description, r.debts)
                .await
        }
    };

    match res {
        Ok(t) => Ok(Json(t)),
        Err(e) => match e {
            TransactionCreationError::GroupNotFound => Err(Status::NotFound),
            TransactionCreationError::DebtorNotInGroup => Err(Status::BadRequest),
        },
    }
}

#[delete("/<group_id>/transaction/<transaction_id>")]
async fn delete_group_transaction(
    group_id: String,
    transaction_id: String,
    group_service: &State<GroupService>,
    user: User,
) -> Status {
    match group_service
        .delete_transaction(&group_id, &user.id, &transaction_id)
        .await
    {
        true => Status::Ok,
        false => Status::NotFound,
    }
}

#[get("/<group_id>/debt")]
async fn get_group_debts(
    group_id: String,
    group_service: &State<GroupService>,
    user: User,
) -> Result<Json<Vec<Debt>>, Status> {
    match group_service
        .get_debts_of_user_in_group(&group_id, &user.id)
        .await
    {
        Some(d) => Ok(Json(d)),
        None => Err(Status::NotFound),
    }
}

pub fn routes() -> Vec<rocket::Route> {
    routes![
        get_all_groups,
        get_group,
        create_group,
        get_group_members,
        create_group_member,
        get_group_transactions,
        create_group_tansaction,
        delete_group_transaction,
        get_group_debts
    ]
}
