import React, { useState, useEffect } from 'react';
import SimpleMDE from 'react-simplemde-editor';
// import 'easymde/dist/easymde.min.css';
import { Redirect } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import { getBlog, updateBlog } from '../firebase/firestore';
import { uploadBlogImage } from '../firebase/storage';
import style from './BlogEdit.module.scss';

const ImageBox = ({ filename, url }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.target.select();
    document.execCommand('Copy');
  };
  return (
    <div className={style.image_box}>
      <img src={url} alt={filename} />
      <Form>
        <Form.Control onClick={handleClick} readOnly value={`![${filename}](${url})`} />
      </Form>
    </div>
  );
};

export default (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const { id } = props.match.params;
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState([]);
  const [submited, setSubmited] = useState(false);

  useEffect(
    () => {
      getBlog(id).then((blog) => {
        setMarkdown(blog.content);
        setTitle(blog.title);
        setTags((blog.tags || []).join(' '));
        setImages(blog.images || []);
      });
    },
    [],
  );

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };
  const handleTagChange = (e) => {
    setTags(e.target.value);
  };
  const handleMarkdownChange = (e) => {
    setMarkdown(e);
  };
  const handleDrop = (data, e) => {
    e.preventDefault();
    const { files } = e.dataTransfer;
    if (!files) return;
    const blogImageList = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      blogImageList.push(uploadBlogImage(id, file));
    }

    Promise.all(blogImageList).then((fileUrls) => {
      const deltaImages = fileUrls.map((url, index) => (
        `${files[index].name}|${url}`
      ));
      const newImages = [
        ...images,
        ...deltaImages,
      ];
      setImages(newImages);
      updateBlog(id, {
        images: newImages,
      });
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    updateBlog(id, {
      title,
      content: markdown,
      tags: tags.split(' '),
    }).then(() => {
      setSubmited(true);
    });
  };
  if (submited) {
    return <Redirect to="/admin/blog" />;
  }
  return (
    <Container>
      <h1 className="section-title">Blog Editor</h1>
      <Form>
        <Form.Group key="title">
          <Form.Label>Title</Form.Label>
          <Form.Control key="title" placeholder="Title" type="text" onChange={handleTitleChange} value={title} />
        </Form.Group>
        <Form.Group key="tag">
          <Form.Label>Tag</Form.Label>
          <Form.Control key="tags" placeholder="Tags" type="text" onChange={handleTagChange} value={tags} />
        </Form.Group>
      </Form>
      <div className={style.image_container}>
        {images.map((fileinfo) => {
          const infosplit = fileinfo.split('|');
          const filename = infosplit[0];
          const fileurl = infosplit[1];
          return <ImageBox key={filename} filename={filename} url={fileurl} />;
        })}
      </div>
      <Form>
        <SimpleMDE
          key={images.join(' ')}
          onChange={handleMarkdownChange}
          value={markdown}
          events={{
            drop: handleDrop,
          }}
        />
        <Form.Control key="update" type="submit" onClick={handleSubmit} value="Update" />
      </Form>
    </Container>
  );
};
