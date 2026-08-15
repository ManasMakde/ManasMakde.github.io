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
   npm start
   ```


## 📖 Blog Article Template
~~~jsx
export const metadata = {
    title: 'Your Title',
    description: "Your Description",
    thumbnail: "your-thumbnail.webp",
    createdOnDate: new Date("2000-01-25"),
    editedOnDate: new Date("2000-01-30"),
    searchKeywords: ["your", "searchable", "keywords", "here"],
    isSearchable: true,
    toPublish: true,
}


Hi this is my blog!

<CodeTabs id={"My-Code-Block"} activeIndex={1} dropdown={true} childrenStyle={"background-color:blue"}> 
```Python
print("Hello from blog!")
```

```txt display-name="Custom Name" style="background-color:green; height:10rem"
Hello from blog!
```
</CodeTabs>
~~~


## 🔑 License
MIT NON-AI © [Manas Ravindra Makde](https://manasmakde.github.io/)
