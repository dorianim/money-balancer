use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use rocket::serde::{Deserialize, Serialize};
use sea_orm::*;
use std::{collections::HashMap, process, sync::Arc};

use super::{configuration::ConfigurationService, user::UserService};

#[derive(Debug)]
pub struct AuthenticationService {
    db: Arc<DatabaseConnection>,
    configuration_service: Arc<ConfigurationService>,
    user_service: Arc<UserService>,
}

#[derive(Debug)]
pub enum AuthenticationError {
    InvalidToken,
    MissingToken,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtClaims {
    pub id: String,
    iss: String,
    exp: usize,
}

impl AuthenticationService {
    pub fn new(
        db: Arc<DatabaseConnection>,
        configuration_service: Arc<ConfigurationService>,
        user_service: Arc<UserService>,
    ) -> AuthenticationService {
        // make sure, we have at least one working provider
        let new = AuthenticationService {
            db: db,
            configuration_service: configuration_service,
            user_service: user_service,
        };

        if !new._config_valid() {
            process::exit(1);
        }

        new
    }

    pub fn local_enabled(&self) -> bool {
        match self.configuration_service.auth_local() {
            Some(_) => true,
            None => false,
        }
    }

    pub async fn authenticate_local(&self, username: &str, password: &str) -> Option<String> {
        self.configuration_service.auth_local()?;

        Some(
            self.generate_jwt(
                self.user_service
                    .check_username_and_password(username, password)
                    .await?,
            ),
        )
    }

    pub fn proxy_enabled(&self) -> bool {
        match self.configuration_service.auth_proxy() {
            Some(_) => true,
            None => false,
        }
    }

    pub async fn authenticate_proxy(&self, headers: HashMap<String, String>) -> Option<String> {
        let config = self.configuration_service.auth_proxy()?;

        // TODO
        Some("bla".to_owned())
    }

    fn _config_valid(&self) -> bool {
        if let Some(c) = self.configuration_service.auth_proxy() {
            if c.headers_username.is_none() {
                println!("Error: You have enabled proxy authentication but not specified the username header!");
                return false;
            }
            return true;
        }

        if self.local_enabled() {
            return true;
        }

        println!("Error: at least one authentication provider must be enabled!");
        false
    }

    pub async fn validate_jwt(
        &self,
        token: String,
    ) -> Result<JwtClaims, jsonwebtoken::errors::Error> {
        let mut validation = Validation::new(Algorithm::HS256);
        validation.set_issuer(&["de:itsblue:money-balancer"]);
        validation.validate_exp = false;

        let token = jsonwebtoken::decode::<JwtClaims>(
            &token,
            &DecodingKey::from_secret(self.configuration_service.jwt_secret().as_bytes()),
            &validation,
        )?;

        Ok(token.claims)
    }

    pub fn generate_jwt(&self, user_id: String) -> String {
        let jwt = jsonwebtoken::encode(
            &jsonwebtoken::Header::default(),
            &JwtClaims {
                id: user_id.to_owned(),
                iss: "de:itsblue:money-balancer".to_string(),
                exp: 0,
            },
            &jsonwebtoken::EncodingKey::from_secret(
                self.configuration_service.jwt_secret().as_bytes(),
            ),
        );

        jwt.unwrap()
    }
}
