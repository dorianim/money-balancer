use crate::model::{self};
use ::serde::Serialize;
use futures::future;
use sea_orm::*;

use std::sync::Arc;

use super::user::User;

#[derive(Serialize)]
pub struct GroupMember {
    id: String,
    nickname: String,
    is_owner: bool,
}

#[derive(Serialize)]
pub struct Group {
    id: String,
    name: String,
    members: Vec<GroupMember>,
}

#[derive(Serialize, Debug, FromQueryResult)]
struct GroupQueryResult {
    id: String,
}

#[derive(Debug)]
pub struct GroupService {
    db: Arc<DatabaseConnection>,
}

impl GroupService {
    pub fn new(db: Arc<DatabaseConnection>) -> GroupService {
        GroupService { db: db }
    }

    pub async fn create_group(&self, name: String, owner: User) -> Group {
        let new_group_id = uuid::Uuid::new_v4().to_string();

        let new_group = model::group::ActiveModel {
            id: ActiveValue::Set(new_group_id.to_owned()),
            name: ActiveValue::Set(name.to_owned()),
        };

        model::group::Entity::insert(new_group)
            .exec(self.db.as_ref())
            .await
            .expect("error creating group");

        model::group_member::Entity::insert(model::group_member::ActiveModel {
            user_id: ActiveValue::Set(owner.id.to_owned()),
            group_id: ActiveValue::Set(new_group_id.to_owned()),
            is_owner: ActiveValue::Set(1),
        })
        .exec(self.db.as_ref())
        .await
        .expect("error creating group member");

        Group {
            id: new_group_id,
            name: name,
            members: vec![GroupMember {
                id: owner.id,
                nickname: owner.nickname,
                is_owner: true,
            }],
        }
    }

    pub async fn get_groups_of_user(&self, user: User) -> Vec<Group> {
        let groups = model::group_member::Entity::find()
            .filter(model::group_member::Column::UserId.eq(user.id))
            .find_also_related(model::group::Entity)
            .all(self.db.as_ref())
            .await
            .expect("failed to query groups of user")
            .into_iter()
            .map(|(_, group)| self.populate_group_members_and_debt(group.unwrap()));

        future::join_all(groups).await
    }

    pub async fn get_group_of_user(&self, group_id: String, user_id: String) -> Option<Group> {
        let group = model::group_member::Entity::find()
            .filter(model::group_member::Column::UserId.eq(user_id))
            .filter(model::group_member::Column::GroupId.eq(group_id))
            .find_also_related(model::group::Entity)
            .one(self.db.as_ref())
            .await
            .expect("error querying group")
            .map(|(_, group)| group.unwrap());

        match group {
            None => None,
            Some(group) => Some(self.populate_group_members_and_debt(group).await),
        }
    }

    pub async fn get_members_of_group_of_user(
        &self,
        group_id: String,
        user_id: String,
    ) -> Option<Vec<GroupMember>> {
        if !self
            .is_user_member_of_group(group_id.to_owned(), user_id)
            .await
        {
            return None;
        }

        Some(self.get_group_members(group_id).await)
    }

    async fn populate_group_members_and_debt(&self, group: model::group::Model) -> Group {
        let members = self.get_group_members(group.id.to_owned()).await;

        Group {
            id: group.id,
            name: group.name,
            members: members,
        }
    }

    async fn get_group_members(&self, group_id: String) -> Vec<GroupMember> {
        model::group_member::Entity::find()
            .filter(model::group_member::Column::GroupId.eq(group_id))
            .find_also_related(model::user::Entity)
            .all(self.db.as_ref())
            .await
            .expect("error loading group members")
            .into_iter()
            .map(|(group_member, user)| {
                let user = user.unwrap();
                GroupMember {
                    id: user.id,
                    nickname: user.nickname,
                    is_owner: group_member.is_owner == 1,
                }
            })
            .collect::<Vec<GroupMember>>()
    }

    async fn is_user_member_of_group(&self, group_id: String, user_id: String) -> bool {
        let res = model::group_member::Entity::find()
            .filter(model::group_member::Column::GroupId.eq(group_id))
            .filter(model::group_member::Column::UserId.eq(user_id))
            .one(self.db.as_ref())
            .await
            .expect("error querying user membership");

        match res {
            Some(_) => true,
            None => false,
        }
    }
}
