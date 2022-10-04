use crate::guards::authentication;
use crate::model;
use pwhash::bcrypt;
use rocket::serde::Serialize;
use sea_orm::*;
use std::sync::Arc;

use super::configuration::ConfigurationService;

#[derive(Serialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub nickname: String,
}

#[derive(Debug)]
pub struct UserService {
    db: Arc<DatabaseConnection>,
    configuration_service: Arc<ConfigurationService>,
}

impl Into<User> for crate::model::user::Model {
    fn into(self) -> User {
        User {
            id: self.id,
            username: self.username,
            nickname: self.nickname,
        }
    }
}

impl UserService {
    pub fn new(
        db: Arc<DatabaseConnection>,
        configuration_service: Arc<ConfigurationService>,
    ) -> UserService {
        UserService {
            db: db,
            configuration_service: configuration_service,
        }
    }

    pub async fn create_user(
        &self,
        username: String,
        nickname: String,
        password: String,
    ) -> Result<User, ()> {
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

        Ok(User {
            id: new_user_id,
            username: username,
            nickname: nickname,
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
            Ok(authentication::generate_jwt(
                user.id,
                self.configuration_service.jwt_secret(),
            ))
        }
    }

    pub async fn get_user_by_id(&self, user_id: String) -> Result<User, ()> {
        let user = model::user::Entity::find_by_id(user_id)
            .one(self.db.as_ref())
            .await
            .expect("Failed to query user!");

        if let None = user {
            return Err(());
        }

        let user = user.unwrap();

        Ok(user.into())
    }
}
