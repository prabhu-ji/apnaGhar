import './list.scss';
import Card from "../card/Card";
import { useState } from 'react';
import { Link } from 'react-router-dom';

function List({ posts: initialPosts, listType, renderEditButton }) {
  const [posts, setPosts] = useState(initialPosts);
  
  const handleDelete = (deletedPostId) => {
    setPosts(posts.filter(post => post.id !== deletedPostId));
  };
  
  return (
    <div className='list'>
      {posts && posts.length > 0 ? (
        posts.map(item => (
          <div key={item.id} className="postItem">
            <Card item={item} onDelete={handleDelete} listType={listType} />
            
            {renderEditButton && (
              <Link to={`/edit/${item.id}`}>
                <button className="editButton">Edit Post</button>
              </Link>
            )}
          </div>
        ))
      ) : (
        <div className="no-results">No properties found matching your criteria</div>
      )}
    </div>
  );
}

export default List;