export DATABASE_URL="sqlite:./money-balancer.sqlite?mode=rwc"

while [[ "$(sea-orm-cli migrate status)" == *"Pending"* ]]; do
    sea-orm-cli migrate up
done

sea-orm-cli generate entity -o src/model
