use std::process;

use envconfig::Envconfig;

#[derive(Envconfig, Debug)]
pub struct ProxyAuthConfig {
    #[envconfig(from = "MONEYBALANCER_AUTH_PROXY_ENABLED", default = "false")]
    enabled: bool,
    #[envconfig(from = "MONEYBALANCER_AUTH_PROXY_HEADERS_USERNAME")]
    pub headers_username: Option<String>,
    #[envconfig(from = "MONEYBALANCER_AUTH_PROXY_HEADERS_NICKNAME")]
    pub headers_nickname: Option<String>,
}

#[derive(Envconfig, Debug)]
struct LocalAuthConfig {
    #[envconfig(from = "MONEYBALANCER_AUTH_LOCAL_ENABLED", default = "true")]
    enabled: bool,
}

#[derive(Envconfig, Debug)]
struct AuthConfig {
    #[envconfig(nested = true)]
    proxy: ProxyAuthConfig,
    #[envconfig(nested = true)]
    local: LocalAuthConfig,
}

#[derive(Envconfig, Debug)]
pub struct ConfigurationService {
    #[envconfig(from = "MONEYBALANCER_JWT_SECRET")]
    jwt_secret: String,

    #[envconfig(nested = true)]
    auth: AuthConfig,
}

impl ConfigurationService {
    pub fn new() -> ConfigurationService {
        let res = ConfigurationService::init_from_env();

        if let Ok(c) = res {
            return c;
        }

        println!("Error loading config:");
        println!("{}", res.unwrap_err().to_string());
        process::exit(1);
    }

    pub fn jwt_secret(&self) -> &str {
        &self.jwt_secret
    }

    pub fn auth_local(&self) -> Option<()> {
        match self.auth.local.enabled {
            false => None,
            true => Some(()),
        }
    }

    pub fn auth_proxy(&self) -> Option<&ProxyAuthConfig> {
        match self.auth.proxy.enabled {
            false => None,
            true => Some(&self.auth.proxy),
        }
    }
}
