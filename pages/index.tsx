import Head from 'next/head'
import Image from 'next/image'

import Loader from '../components/Loader'
import toast from 'react-hot-toast'

export default function Home() {
  return (
    <div>
      <div>Home Page</div>
      <Loader show />
      <div>
        <button onClick={() => toast.success('hello-react')}>
          Toast Me
        </button>
      </div>
    </div>
  )
}
