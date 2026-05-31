# Portfolio Website

## 💻 Setup Locally

1. Make sure you have [node.js](https://nodejs.org/en) installed along with npm.
1. Clone this repository:
    ```
    git clone https://github.com/ManasMakde/ManasMakde.github.io.git
    ```
1. Navigate into the repository folder:
   ```
   cd ManasMakde.github.io
   ```
1. Install Dependencies:
    ```
    npm i 
    ```
1. Run the start command & you will see the website on `localhost:3000`
   ```
   npm run start
   ```

## 📖 Template
~~~jsx
export const metaData = {
    title: 'Your Title',
    thumbnail: "your-thumbnail.webp",
    author: "Your Name",                        // Optional
    authorWebsite: "https://yourwebsite.com/",  // Optional
    createdOnDate: new Date("2023-11-01"), 
    editedOnDate: new Date("2023-11-12"),       // Optional
    isUnlisted: true,                           // Optional
    tags: ["your", "tags", "here"],
    keywords: ["your", "keywords", "here"]      // Optional, These are used purely in searching
};


How to write Hello World:

<CodeTabs id={"My-Code-Block"} activeIndex={1} dropdown={true} childrenStyle={"background-color:blue"}> 
```Python
print("Hello World")
```

```txt display-name="Custom Name" style="background-color:green; height:10rem"
Hello World!
```
</CodeTabs>
~~~

## 🔑 License

MIT NON-AI © [Manas Ravindra Makde](https://manasmakde.github.io/)
