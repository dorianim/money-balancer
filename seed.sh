kill $(lsof -t -i:8000)

set -e

# setup
JWT_SECRET=secret cargo run &

sleep 3

URL=localhost:8000

# if .env does not exist -> create users
if [ ! -f .env ]; then
    # create test users
    http post $URL/user username=alice nickname=ALICE password=alice
    http post $URL/user username=bob nickname=BOB password=bob
    http post $URL/user username=charlie nickname=CHARLIE password=charlie

    # login
    echo "TOKEN_ALICE=$(http post $URL/user/token username=alice password=alice | jq -r .token)" > .env
    echo "TOKEN_BOB=$(http post $URL/user/token username=bob password=bob | jq -r .token)" >> .env
    echo "TOKEN_CHARLIE=$(http post $URL/user/token username=charlie password=charlie | jq -r .token)" >> .env
fi

source ./.env

# create test groups
http -A bearer -a $TOKEN_ALICE post $URL/group name=alices_group