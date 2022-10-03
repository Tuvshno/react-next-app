import styles from '../../styles/Post.module.css';
import { firestore, getUserWithUsername, postToJSON } from '../../lib/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import Metatags from '../../components/Metatags';
import PostContent from '../../components/PostContent';

//Static Generation
export async function getStaticProps({ params }) {
  //Getting the username and slug from the url
  const { username, slug } = params

  //Get the doc from the username
  const userDoc = await getUserWithUsername(username)

  let post
  let path

  if (userDoc) {
    const postRef = userDoc.ref.collection('posts').doc(slug)
    post = postToJSON(await postRef.get())

    path = postRef.path
  }

  return {
    props: { post, path },
    revalidate: 5000,
  }

}

export async function getStaticPaths() {
  const snapshot = await firestore.collectionGroup('posts').get();

  const paths = snapshot.docs.map((doc) => {
    const { slug, username } = doc.data();
    return {
      params: { username, slug },
    };
  });

  return {
    // must be in this format:
    // paths: [
    //   { params: { username, slug }}
    // ],
    paths,
    fallback: 'blocking',
  }
}

//Username Page Post
export default function Post(props) {

  const postRef = firestore.doc(props.path)
  const [realtimePost] = useDocumentData(postRef as any)

  const post = realtimePost || props.post

  return (
    <main className={styles.container}>

      <Metatags title="Post"/>

      <section>
        <PostContent post={post} />
      </section>

      <aside className="card">
        <p>
          <strong>{post.heartCount || 0} 🤍</strong>
        </p>

      </aside>
    </main>
  )
}

