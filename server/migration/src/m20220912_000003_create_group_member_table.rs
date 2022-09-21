use sea_orm_migration::prelude::*;

use super::{m20220912_000001_create_user_table::User, m20220912_000002_create_group_table::Group};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20220912_000003_create_group_member_table"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(GroupMember::Table)
                    .col(ColumnDef::new(GroupMember::UserId).string().not_null())
                    .col(ColumnDef::new(GroupMember::GroupId).string().not_null())
                    .col(ColumnDef::new(GroupMember::IsOwner).boolean().not_null())
                    .primary_key(
                        Index::create()
                            .col(GroupMember::UserId)
                            .col(GroupMember::GroupId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(GroupMember::Table, GroupMember::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(GroupMember::Table, GroupMember::GroupId)
                            .to(Group::Table, Group::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(GroupMember::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum GroupMember {
    Table,
    UserId,
    GroupId,
    IsOwner,
}
