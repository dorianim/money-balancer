use std::collections::HashMap;

use crate::model::{balance, balance_member, prelude::*, user, user_debt};
use futures::future::{join_all, Map};
use pwhash::bcrypt;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::{Deserialize, Serialize};
use rocket::*;
use sea_orm::entity::prelude::*;
use sea_orm::*;

#[derive(Deserialize)]
struct BalanceCreationRequest {
    name: String,
}

#[derive(Serialize)]
struct ReducedUser {
    id: String,
    username: String,
    nickname: String,
}

#[derive(Serialize)]
struct FullBalance {
    id: String,
    name: String,
    user_debts: HashMap<String, f64>,
    members: HashMap<String, ReducedUser>,
}

#[get("/")]
async fn get_all_balances(
    user: user::Model,
    db: &State<DatabaseConnection>,
) -> Result<Json<Vec<FullBalance>>, Status> {
    let db = db as &DatabaseConnection;

    Ok(Json(Vec::new()))
    /*let balances = Vec::new().into_iter(); /*user
                                           .find_related(balance_member::Entity)
                                           .find_also_related(balance::Entity)
                                           .all(db)
                                           .await
                                           .expect("error loading balances")
                                           .into_iter()
                                           .map(|b| b.1.unwrap());*/

    let balances_with_members_and_balances = balances.map(|b| async {
        let members = get_members_of_balance(b.clone(), db)
            .await
            .into_iter()
            .map(|balance_member| {
                (
                    balance_member.clone().id,
                    ReducedUser {
                        id: balance_member.id,
                        username: balance_member.username,
                        nickname: balance_member.nickname,
                    },
                )
            })
            .collect::<HashMap<String, ReducedUser>>();

        let user_debts = get_user_debts_of_balance(b.clone(), db)
            .await
            .into_iter()
            .map(|user_debt| {
                (
                    format!("{}:{}", user_debt.creditor_id, user_debt.debtor_id),
                    user_debt.amount,
                )
            })
            .collect::<HashMap<String, f64>>();

        FullBalance {
            id: b.id,
            name: b.name,
            user_debts: user_debts,
            members: members,
        }
    });

    Ok(Json(join_all(balances_with_members_and_balances).await))*/
}

#[post("/", data = "<balance_creation_request>")]
async fn create_balance(
    user: user::Model,
    db: &State<DatabaseConnection>,
    balance_creation_request: Json<BalanceCreationRequest>,
) {
    let db = db as &DatabaseConnection;

    let new_balance_id = uuid::Uuid::new_v4().to_string();

    let new_balance = balance::ActiveModel {
        id: ActiveValue::Set(new_balance_id.to_owned()),
        name: ActiveValue::Set(balance_creation_request.name.to_owned()),
    };

    Balance::insert(new_balance)
        .exec(db)
        .await
        .expect("error creating balance");

    BalanceMember::insert(balance_member::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        user_id: ActiveValue::Set(user.id.to_owned()),
        balance_id: ActiveValue::Set(new_balance_id.to_owned()),
        is_owner: ActiveValue::Set(1),
    })
    .exec(db)
    .await
    .expect("error creating balance member");
}

async fn get_members_of_balance(
    balance: balance::Model,
    db: &DatabaseConnection,
) -> Vec<user::Model> {
    /*balance
    .find_related(balance_member::Entity)
    .find_also_related(user::Entity)
    .all(db)
    .await
    .expect("error loading balance members")
    .into_iter()
    .map(|balance_member| balance_member.1.unwrap())
    .collect::<Vec<user::Model>>()*/
    Vec::new()
}
async fn get_user_debts_of_balance(
    balance: balance::Model,
    db: &DatabaseConnection,
) -> Vec<user_debt::Model> {
    /*balance
    .find_related(balance_member::Entity)
    .find_with_related(user_debt::Entity)
    .all(db)
    .await
    .expect("error loading balance member user debts")
    .into_iter()
    .map(|balance_member| balance_member.1.unwrap())
    .collect::<Vec<user_debt::Model>>()*/
    Vec::new()
}

pub fn routes() -> Vec<rocket::Route> {
    routes![get_all_balances, create_balance]
}
