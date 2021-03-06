// Converts all dates into correct formatting
function convert_date() {
  const dates = document.getElementsByClassName('publish-date');
  for (date of dates) {
    months_name = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const year = date.textContent.match(/\d{4}/).join();
    let month = date.textContent
      .match(/-\d{2}/)
      .join()
      .match(/\d{2}/)
      .join();
    month = months_name[+month];
    const day = date.textContent
      .match(/-\d{2} /)
      .join()
      .match(/\d{2}/)
      .join();
    const time = date.textContent.match(/\d{2}:\d{2}:\d{2}/).join();
    date.innerHTML = `${month} ${day} ${year} ${time}`;
  }
}

// Switch tabs between showing users and posts (for admin panel)
function switch_tabs() {
  const tab_list = document.getElementById('admin-tabs');
  tab_list.addEventListener('click', (e) => {
    if (e.target.className == 'nav-link') {
      const posts = document.getElementById('posts-tab');
      const users = document.getElementById('users-tab');
      if (e.target.id == 'tab-2') {
        const old_tab = document.getElementById('tab-1');
        old_tab.className = 'nav-link';
        e.target.className = 'nav-link active';
        users.style.display = 'block';
        posts.style.display = 'none';
        console.log(posts.style.display);
      } else {
        const old_tab = document.getElementById('tab-2');
        old_tab.className = 'nav-link';
        e.target.className = 'nav-link active';
        users.style.display = 'none';
        posts.style.display = 'block';
      }
    }
  });
}

// Gets the amounts of likes and dislikes for a given post
async function fetch_likes(like_bar, e, i) {
  const vote_class = e.target.className;
  const post_id = like_bar[i].parentElement.id;

  let data = await fetch(`/post/votes/${post_id}`);
  data = await data.json();

  // Case where user is first voting to upvote
  if (vote_class == 'upvote') {
    e.target.className = `${vote_class} voted`;
    // Case where user is changing votes
    if (like_bar[i].childNodes[3].className == 'devote voted') {
      like_bar[i].childNodes[3].className = 'devote';
      data.dislikes--;
    }
    data.likes++;
  }
  // Case where user is first voting to devote
  else if (vote_class == 'devote') {
    e.target.className = `${vote_class} voted`;
    // Case where user is changing votes
    if (like_bar[i].childNodes[1].className == 'upvote voted') {
      like_bar[i].childNodes[1].className = 'upvote';
      data.likes--;
    }
    data.dislikes++;
  }
  // Case where user is first voting to remove their vote
  else {
    if (vote_class == 'upvote voted') {
      like_bar[i].childNodes[1].className = 'upvote';
      data.likes--;
    } else if (vote_class == 'devote voted') {
      like_bar[i].childNodes[3].className = 'devote';
      data.dislikes--;
    }
  }

  return data;
}

// Updates and keeps track on which posts the user has liked and disliked
function like_bar() {
  const like_bar = document.getElementsByClassName('like-bar');
  if (like_bar) {
    for (let i = 0; i < like_bar.length; i++) {
      const post_id = like_bar[i].parentElement.id;
      // Update current status of likes on a fresh refresh
      fetch(`/post/votes/status/${post_id}`)
        .then((r) => r.json())
        .then((data) => {
          const isLiked = data.status;
          console.log('Currnt data: ', data);
          console.log('Update current like: ' + isLiked);

          // Signifies a vote has been made previously
          if (isLiked != 'null') {
            // Signifies that the post was liked
            if (isLiked) {
              like_bar[i].childNodes[1].className = 'upvote voted';
            }
            // Signifies that the post was disliked
            else if (!isLiked) {
              like_bar[i].childNodes[3].className = 'devote voted';
            }
          }
        });

      like_bar[i].addEventListener('click', (e) => {
        // Original values/status of likes and dislikes before user can vote
        const og_likes = like_bar[i].childNodes[1].textContent.match(/\d+/);
        const og_dislikes = like_bar[i].childNodes[3].textContent.match(/\d+/);
        const og_likes_status = like_bar[i].childNodes[1].className.match(
          /voted/
        );
        const og_dislikes_status = like_bar[i].childNodes[3].className.match(
          /voted/
        );

        fetch_likes(like_bar, e, i).then((data) => {
          const request = new XMLHttpRequest();
          request.open('POST', `/post/votes/${post_id}`, true);
          request.onload = function () {
            if (this.status == 200) console.log('POST request complete');
            else console.log('Error, unable to complete POST request');
          };
          request.setRequestHeader(
            'Content-type',
            'application/x-www-form-urlencoded'
          );

          let status = 'add';
          let isLike = 0;

          const curr_status_upvote = like_bar[i].childNodes[1].className;
          const curr_status_devote = like_bar[i].childNodes[3].className;

          // If this vote is after a non-vote
          if (og_likes_status != 'voted' && og_dislikes_status != 'voted') {
            // If user has dislike the post
            if (og_dislikes < data.dislikes && og_likes == data.likes)
              isLike = 0;
            // If user has like the post
            else isLike = 1;
          }
          // If this vote changes the last vote
          else {
            // reset back to no votes made
            if (
              curr_status_upvote == 'upvote' &&
              curr_status_devote == 'devote'
            )
              status = 'remove';
            // If user has dislike the post
            else if (og_dislikes < data.dislikes && og_likes > data.likes) {
              status = 'change';
              isLike = 0;
            }
            // If user has like the post
            else {
              status = 'change';
              isLike = 1;
            }
          }
          console.log('Sending type of status: ' + status);
          console.log('Sending isLike status: ' + isLike);
          request.send(
            `likes=${data.likes}&dislikes=${data.dislikes}&post_id=${post_id}
            &status=${status}&vote=${isLike}`
          );
          like_bar[i].childNodes[1].textContent = `Likes: ${data.likes}`;
          like_bar[i].childNodes[3].textContent = `Dislikes: ${data.dislikes}`;
        });
      });
    }
  }
}

function main() {
  convert_date();
  const tab_list = document.getElementById('admin-tabs');
  if (tab_list) switch_tabs();
  like_bar();
}

main();
