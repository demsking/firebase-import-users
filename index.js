'use strict'

const admin = require('firebase-admin')
const credentialFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS
const config = require(credentialFilename)

const connect = () => {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.project_id,
      clientEmail: config.client_email,
      privateKey: config.private_key
    }),
    databaseURL: `https://${config.project_id}.firebaseio.com`
  })

  this.auth = admin.auth()
  this.database = admin.database()
}

function generatePassword () {
  const length = 8
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let retVal = ''

  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n))
  }

  return retVal
}

const firstCapitalLetter = (str) => {
  if (str.length === 0) {
    return str
  }

  return str[0].toUpperCase() + str.substring(1).toLowerCase()
}

const formatName = ({ first_name, last_name }) => {
  if (!first_name) {
    return firstCapitalLetter(last_name)
  }

  first_name = firstCapitalLetter(first_name.trim())

  if (last_name) {
    last_name = firstCapitalLetter(last_name.trim())

    return first_name + ' ' + last_name
  }

  return first_name
}

const toTimestamp = (str) => new Date(str).getTime()

const COLLECTION = 'members'
const makeKey = (email) => email.replace(/[\.#$\[\]]/g, '')
const makeUri = (key) => COLLECTION + '/' + key

const saveProfile = ({ uid, email, name, location = '', date }) => {
  const key = makeKey(email)
  const domain = email.split(/@/)[1]
  const model = { uid, key, name, email, date, location, domain }

  return this.database.ref(makeUri(model.key)).set(model)
}

const register = (members) => {
  if (members.length === 0) {
    return
  }

  connect()

  let iterator = 0

  const closeOnFinishing = () => {
    if (++iterator === members.length) {
      process.exit()
    }
  }

  members.forEach((member) => {
    const user = {
      email: member.email,
      emailVerified: true,
      password: generatePassword(),
      displayName: formatName(member),
      disabled: false
    }
    const date = member.initial_date || member.timestamp
    const run = () => {
      this.auth.createUser(member)
        .then((userRecord) => ({
          uid: userRecord.uid,
          email: user.email,
          name: user.displayName,
          date: toTimestamp(date)
        }))
        .then(saveProfile)
        .then(() => console.log(JSON.stringify(member)))
        .then(closeOnFinishing)
        .catch((error) => {
          console.error(JSON.stringify({ member, error }))
          closeOnFinishing()
        })
    }

    setTimeout(run, process.argv.length === 2 ? 300 : 0)
  })
}

const updateProfile = (members) => {
  if (members.length === 0) {
    return
  }

  connect()

  let iterator = 0

  const closeOnFinishing = () => {
    if (++iterator === members.length) {
      process.exit()
    }
  }

  members.forEach((member) => {
    const profile = {
      uid: '',
      email: member.email,
      name: formatName(member),
      date: toTimestamp(member.initial_date || member.timestamp)
    }

    saveProfile(profile)
      .then(() => console.log(JSON.stringify(member)))
      .then(closeOnFinishing)
      .catch((error) => {
        console.error(JSON.stringify({ member, error }))
        closeOnFinishing()
      })
  })
}

let json = ''

process.openStdin()
  .on('data', (chunk) => (json += chunk))
  .on('end', () => {
    const input = JSON.parse(json)

    if (process.argv.length > 2) {
      switch (process.argv[2]) {
        case '--retry':
          const entries = input.filter((item) => {
            if (item.error.hasOwnProperty('code')) {
              return item.error.code !== 'auth/email-already-exists'
            }
            return false
          })

          if (entries.length) {
            register(entries.map((item) => item.member))
          }
          break

        case '--update-profile':
          updateProfile(input)
          break

        default:
          throw new Error(`Unknow ${process.argv[2]} option`)
      }
    } else {
      register(input)
    }
  })
