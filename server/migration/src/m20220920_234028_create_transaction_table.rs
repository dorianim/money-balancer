use sea_orm_migration::prelude::*;

use crate::{m20220912_000001_create_user_table::User, m20220912_000002_create_group_table::Group};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Transaction::Table)
                    .col(
                        ColumnDef::new(Transaction::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Transaction::GroupId).string().not_null())
                    .col(ColumnDef::new(Transaction::CreditorId).string().not_null())
                    .col(ColumnDef::new(Transaction::Description).string().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .from(Transaction::Table, Transaction::GroupId)
                            .to(Group::Table, Group::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Transaction::Table, Transaction::CreditorId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Transaction::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
pub enum Transaction {
    Table,
    Id,
    GroupId,
    CreditorId,
    Description,
}
