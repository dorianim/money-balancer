use std::collections::HashMap;

use crate::model::{debt, group, group_member, prelude::*, user};
use futures::future::{join_all, Map};
use pwhash::bcrypt;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::{Deserialize, Serialize};
use rocket::*;
use sea_orm::entity::prelude::*;
use sea_orm::*;

#[derive(Deserialize)]
struct GroupCreationRequest {
    name: String,
}

#[derive(Serialize)]
struct ReducedUser {
    id: String,
    username: String,
    nickname: String,
}

#[derive(Serialize)]
struct FullGroup {
    id: String,
    name: String,
    user_debts: HashMap<String, f64>,
    members: HashMap<String, ReducedUser>,
}

#[get("/")]
async fn get_all_groups(
    user: user::Model,
    db: &State<DatabaseConnection>,
) -> Result<Json<Vec<FullGroup>>, Status> {
    let db = db as &DatabaseConnection;

    Ok(Json(Vec::new()))
    /*let groups = Vec::new().into_iter(); /*user
                                           .find_related(group_member::Entity)
                                           .find_also_related(group::Entity)
                                           .all(db)
                                           .await
                                           .expect("error loading groups")
                                           .into_iter()
                                           .map(|b| b.1.unwrap());*/

    let groups_with_members_and_groups = groups.map(|b| async {
        let members = get_members_of_group(b.clone(), db)
            .await
            .into_iter()
            .map(|group_member| {
                (
                    group_member.clone().id,
                    ReducedUser {
                        id: group_member.id,
                        username: group_member.username,
                        nickname: group_member.nickname,
                    },
                )
            })
            .collect::<HashMap<String, ReducedUser>>();

        let user_debts = get_user_debts_of_group(b.clone(), db)
            .await
            .into_iter()
            .map(|user_debt| {
                (
                    format!("{}:{}", user_debt.creditor_id, user_debt.debtor_id),
                    user_debt.amount,
                )
            })
            .collect::<HashMap<String, f64>>();

        FullGroup {
            id: b.id,
            name: b.name,
            user_debts: user_debts,
            members: members,
        }
    });

    Ok(Json(join_all(groups_with_members_and_groups).await))*/
}

#[post("/", data = "<group_creation_request>")]
async fn create_group(
    user: user::Model,
    db: &State<DatabaseConnection>,
    group_creation_request: Json<GroupCreationRequest>,
) {
    let db = db as &DatabaseConnection;

    let new_group_id = uuid::Uuid::new_v4().to_string();

    let new_group = group::ActiveModel {
        id: ActiveValue::Set(new_group_id.to_owned()),
        name: ActiveValue::Set(group_creation_request.name.to_owned()),
    };

    Group::insert(new_group)
        .exec(db)
        .await
        .expect("error creating group");

    GroupMember::insert(group_member::ActiveModel {
        user_id: ActiveValue::Set(user.id.to_owned()),
        group_id: ActiveValue::Set(new_group_id.to_owned()),
        is_owner: ActiveValue::Set(1),
    })
    .exec(db)
    .await
    .expect("error creating group member");
}

async fn get_members_of_group(group: group::Model, db: &DatabaseConnection) -> Vec<user::Model> {
    /*group
    .find_related(group_member::Entity)
    .find_also_related(user::Entity)
    .all(db)
    .await
    .expect("error loading group members")
    .into_iter()
    .map(|group_member| group_member.1.unwrap())
    .collect::<Vec<user::Model>>()*/
    Vec::new()
}
async fn get_user_debts_of_group(group: group::Model, db: &DatabaseConnection) -> Vec<debt::Model> {
    /*group
    .find_related(group_member::Entity)
    .find_with_related(user_debt::Entity)
    .all(db)
    .await
    .expect("error loading group member user debts")
    .into_iter()
    .map(|group_member| group_member.1.unwrap())
    .collect::<Vec<user_debt::Model>>()*/
    Vec::new()
}

pub fn routes() -> Vec<rocket::Route> {
    routes![get_all_groups, create_group]
}
