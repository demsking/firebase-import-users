# firebase-import-users
This script helps to import a users list from a CSV file to Firebase

## Usage
```shell
export USERS_LIST=~/path/to/users-list.csv
export GOOGLE_APPLICATION_CREDENTIALS=~/path/to/credentials.json

# Import the users list
make batch-import

# Retry if there are errors
make retry update-profile
```

## CSV header
```csv
"timestamp","email","first_name","last_name"
...
```

## Firebase Admin Credentials
Follow [this link](https://developers.google.com/identity/protocols/application-default-credentials#howtheywork) to get your Firebase Admin Credentials.

## License
Under the MIT license. See [LICENSE](https://github.com/demsking/firebase-import-users/blob/master/LICENSE) file for more details.
