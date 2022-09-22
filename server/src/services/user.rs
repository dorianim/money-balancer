use crate::guards::authentication;
use crate::model;
use pwhash::bcrypt;
use rocket::serde::Serialize;
use sea_orm::*;
use std::sync::Arc;

#[derive(Serialize)]
pub struct FullUser {
    pub id: String,
    pub username: String,
    pub nickname: String,
    pub groups: Vec<ReducedGroup>,
}

#[derive(Serialize)]
pub struct ReducedGroup {
    id: String,
    name: String,
    is_owner: bool,
}

#[derive(Debug)]
pub struct UserService {
    db: Arc<DatabaseConnection>,
}

impl UserService {
    pub fn new(db: Arc<DatabaseConnection>) -> UserService {
        UserService { db: db }
    }

    pub async fn create_user(
        &self,
        username: String,
        nickname: String,
        password: String,
    ) -> Result<FullUser, ()> {
        let new_user_id = uuid::Uuid::new_v4().to_string();

        let new_user = model::user::ActiveModel {
            id: ActiveValue::Set(new_user_id.to_owned()),
            username: ActiveValue::Set(username.to_owned()),
            nickname: ActiveValue::Set(nickname.to_owned()),
            password: ActiveValue::Set(bcrypt::hash(password.to_owned()).unwrap().to_owned()),
        };

        model::user::Entity::insert(new_user)
            .exec(self.db.as_ref())
            .await
            .map_err(|_| ())?;

        Ok(FullUser {
            id: new_user_id,
            username: username,
            nickname: nickname,
            groups: Vec::new(),
        })
    }

    pub async fn create_user_token(
        &self,
        username: String,
        password: String,
    ) -> Result<String, ()> {
        let user = model::user::Entity::find()
            .filter(model::user::Column::Username.eq(username.to_owned()))
            .one(self.db.as_ref())
            .await
            .expect("Failed to query user!");

        let user = match user {
            None => Err(()),
            Some(u) => Ok(u),
        }?;

        if !bcrypt::verify(password.to_owned(), &user.password) {
            Err(())
        } else {
            Ok(authentication::generate_jwt(user.id))
        }
    }

    pub async fn get_user_by_id(&self, user_id: String) -> Result<FullUser, ()> {
        let user = model::user::Entity::find_by_id(user_id)
            .one(self.db.as_ref())
            .await
            .expect("Failed to query user!");

        if let None = user {
            return Err(());
        }

        let user = user.unwrap();

        let user_groups = user
            .find_related(model::group_member::Entity)
            .find_also_related(model::group::Entity)
            .all(self.db.as_ref())
            .await
            .expect("Failed to query user groups!")
            .into_iter()
            .map(|(member, group)| {
                let group = group.unwrap();
                ReducedGroup {
                    id: group.id,
                    name: group.name,
                    is_owner: member.is_owner == 1,
                }
            })
            .collect::<Vec<ReducedGroup>>();

        Ok(FullUser {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            groups: user_groups,
        })
    }
}
