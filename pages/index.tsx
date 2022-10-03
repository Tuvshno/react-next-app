import Head from 'next/head'
import Image from 'next/image'

import Loader from '../components/Loader'
import PostFeed from '../components/PostFeed';
import { firestore, fromMillis, postToJSON } from '../lib/firebase';

import { useState } from 'react';


//Limit Posts Amount
const LIMIT = 1

//Getting Serverside Props
//Getting Posts in this case
export async function getServerSideProps(context) {

  //Query the posts where they are published and ordered by descending
  const postsQuery = firestore
    .collectionGroup('posts')
    .where('published', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(LIMIT)

  //Get The posts and map them with JSON
  const posts = (await postsQuery.get()).docs.map(postToJSON)

  //Return the props to the page component
  return {
    props: { posts }
  }
}

//Page Componenent
export default function Home(props) {
  //State for Posts, filled by the serverside posts
  const [posts, setPosts] = useState(props.posts)

  //State for Loading Posts
  const [loading, setLoading] = useState(false)

  //State for if at the end of Posts
  const [postsEnd, setPostsEnd] = useState(false)

  const getMorePosts = async () => {
    setLoading(true)
    const last = posts[posts.length - 1]

    //Checking if the cursor has the firebase created at or milliseconds, change to firebase, bc we are going to query it
    const cursor = typeof last.createdAt === 'number' ? fromMillis(last.createdAt) : last.createdAt;

    //Query all posts where we start after the last post we queryed
    const query = firestore
      .collectionGroup('posts')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc')
      .startAfter(cursor) //Start after the last place
      .limit(LIMIT);

    //Get the new posts from the query and map the data 
    const newPosts = (await query.get()).docs.map((doc) => doc.data())

    //Add the posts to the new post
    setPosts(posts.concat(newPosts))

    //End the loading
    setLoading(false)

    //Check if we reached the end of our database
    if (newPosts.length < LIMIT) {
      setPostsEnd(true)
    }

  }

  return (
    <main>
      {/* Make a Post Feed of the posts */}
      <PostFeed posts={posts} admin={false} />

      {/* Check if we arent already loading and the at the end of the page -> Make a load more button */}
      {!loading && !postsEnd && <button onClick={getMorePosts}>Load More</button>}

      {/* Show Loading if we are loading */}
      <Loader show={loading} />

      {/* Show posts end if it is true */}
      {postsEnd && 'You have reached the end!'}
    </main>
  )
}
