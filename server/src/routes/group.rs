use std::collections::HashMap;

use crate::model::{debt, group, group_member, prelude::*, user};
use crate::services::user::{FullUser, UserService};
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
    debts: HashMap<String, i32>,
    members: HashMap<String, ReducedUser>,
}

#[get("/")]
async fn get_all_groups(user: FullUser) -> Result<Json<Vec<FullGroup>>, Status> {
    /*let groups = user
    .find_related(group_member::Entity)
    .find_also_related(group::Entity)
    .all(db)
    .await
    .expect("error loading groups")
    .into_iter()
    .map(|b| b.1.unwrap());*/

    /*let groups_with_members_and_groups = groups.map(|b| async {
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

        FullGroup {
            id: b.id,
            name: b.name,
            debts: HashMap::new(),
            members: members,
        }
    });*/

    Ok(Json(Vec::new()))
}

#[post("/", data = "<group_creation_request>")]
async fn create_group(user: FullUser, group_creation_request: Json<GroupCreationRequest>) {
    /*let db = db as &DatabaseConnection;

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
    .expect("error creating group member");*/
}

pub fn routes() -> Vec<rocket::Route> {
    routes![get_all_groups, create_group]
}
