use std::vec;

pub use sea_orm_migration::prelude::*;

mod m20220912_000001_create_user_table;
mod m20220912_000002_create_group_table;
mod m20220912_000003_create_group_member_table;
mod m20220920_234028_create_transaction_table;
mod m20220920_234539_create_debt_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220912_000001_create_user_table::Migration),
            Box::new(m20220912_000002_create_group_table::Migration),
            Box::new(m20220912_000003_create_group_member_table::Migration),
            Box::new(m20220920_234028_create_transaction_table::Migration),
            Box::new(m20220920_234539_create_debt_table::Migration),
        ]
    }
}
