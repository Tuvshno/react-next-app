import { auth, firestore, googleAuthProvider } from '../lib/firebase'
import { useEffect, useState, useCallback, useContext } from 'react';
import { UserContext } from '../lib/context';

import debounce from 'lodash.debounce';
//Sign In Page
export default function EnterPage() {
  const { user, username } = useContext(UserContext)

  //1. user is signed out -> show <SignInButton />
  //2. user is signed in without username -> Show <UsernameForm />
  //3. user is signed in with username -> <SignOutButton />
  return (
    <main>
      {user ? !username ? <UsernameForm /> : <SignOutButton /> : <SignInButton />}
    </main>
  )
}

function SignInButton() {
  const signInWithGoogle = async () => {
    await auth.signInWithPopup(googleAuthProvider)
  }

  return (
    <button className='btn-google' onClick={signInWithGoogle}>
      <img src={'/google.png'} /> Sign in with Google
    </button>
  )
}

function SignOutButton() {
  return <button onClick={() => auth.signOut()}>Sign Out</button>
}

function UsernameForm() {

  //State Handlers
  const [formValue, setFormValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  //Get Our User Context To Update
  const { user, username } = useContext(UserContext);

  const onSubmit = async (e) => {
    e.preventDefault()

    //Create Refs for both documents
    const userDoc = firestore.doc(`users/${user.uid}`)
    const usernameDoc = firestore.doc(`usernames/${formValue}`)

    //Commit both docs together as a batch write
    const batch = firestore.batch()
    batch.set(userDoc, { username: formValue, photoURL: user.photoURL, displayName: user.displayName })
    batch.set(usernameDoc, { uid: user.uid })

    await batch.commit()
  }

  const onChange = (e) => {
    //Force form value to be typed in correct format
    const val = e.target.value.toLowerCase();
    const re = /^(?=[a-zA-Z0-9._]{3,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;

    //Only set form value if length is >3 and passes regex
    if (val.length < 3) {
      setFormValue(val)
      setLoading(false)
      setIsValid(false)
    }

    if (re.test(val)) {
      setFormValue(val)
      setLoading(true)
      setIsValid(false)
    }
  }

  useEffect(() => {
    checkUsername(formValue);
  }, [formValue])

  // Hit the database for username match after each debounced change
  // useCallback is required for debounce to work
  const checkUsername = useCallback(
    debounce(async (username) => {
      if (username.length >= 3) {
        const ref = firestore.doc(`usernames/${username}`);
        const { exists } = await ref.get();
        console.log('Firestore read executed!');
        setIsValid(!exists);
        setLoading(false);
      }
    }, 500),
    []
  )

  //Create a Form To Setup Username
  return (
    !username && (
      <section>
        <h3>Choose Username</h3>
        <form onSubmit={onSubmit}>
          <input name="username" placeholder="myname" value={formValue} onChange={onChange} />
          <UsernameMessage username={formValue} isValid={isValid} loading={loading} />
          <button type="submit" className="btn-green" disabled={!isValid}>
            Choose
          </button>

          <h3>Debug State</h3>
          <div>
            Username: {formValue}
            <br />
            Loading: {loading.toString()}
            <br />
            Username Valid: {isValid.toString()}
          </div>
        </form>
      </section>
    )
  );
}

function UsernameMessage({ username, isValid, loading }) {
  if (loading) {
    return <p>Checking...</p>;
  } else if (isValid) {
    return <p className="text-success">{username} is available!</p>;
  } else if (username && !isValid) {
    return <p className="text-danger">That username is taken!</p>;
  } else {
    return <p></p>;
  }
}
