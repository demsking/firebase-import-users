# firebase-import-users
This script helps to import a users list from a CSV file to Firebase

## Requirements
This script use `jq` for the JSON parsing: [https://stedolan.github.io/jq](https://stedolan.github.io/jq/)

## Usage
```shell
export USERS_LIST=~/path/to/users-list.csv
export GOOGLE_APPLICATION_CREDENTIALS=~/path/to/credentials.json

# Import the users list
make batch-import

# Retry if there are errors
make retry update-profile
```

## CSV format
```csv
"timestamp","email","first_name","last_name"
"2017-01-31 06:32:34","bill.gates@gmail.com","Bill","Gates",
"2017-01-26 19:46:47","jony.bravo@example.com","Jony","Bravo"
"2016-01-18 01:36:38","obama@wiki.com","Obama",""
```

## Firebase Admin Credentials
Follow [this link](https://developers.google.com/identity/protocols/application-default-credentials#howtheywork) to get your Firebase Admin Credentials.

## License
Under the MIT license. See [LICENSE](https://github.com/demsking/firebase-import-users/blob/master/LICENSE) file for more details.
