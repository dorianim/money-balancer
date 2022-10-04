use std::process;

use ::serde::Deserialize;
use config::Config;

#[derive(Debug, Default, Deserialize, PartialEq, Eq)]
struct JwtConfig {
    secret: String,
}

#[derive(Debug, Default, Deserialize, PartialEq, Eq)]
pub struct ConfigurationService {
    jwt: JwtConfig,
}

impl ConfigurationService {
    pub fn new() -> ConfigurationService {
        let res = Config::builder()
            .add_source(
                config::Environment::with_prefix("MONEYBALANCER")
                    .try_parsing(true)
                    .separator("_"),
            )
            .build()
            .unwrap()
            .try_deserialize::<ConfigurationService>();

        if let Ok(c) = res {
            return c;
        }

        let error_message = match res.unwrap_err() {
            config::ConfigError::NotFound(field) => field,
            config::ConfigError::Message(m) => m,
            _ => "unknown error".to_owned(),
        };

        println!("Error loading config: {}", error_message);
        println!("Please make sure, you have set all required environment variables.");
        process::exit(1);
    }

    pub fn jwt_secret(&self) -> String {
        self.jwt.secret.to_owned()
    }
}
