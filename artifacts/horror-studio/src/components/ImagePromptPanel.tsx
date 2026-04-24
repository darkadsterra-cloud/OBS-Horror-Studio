import {useState} from "react";

export default function ImagePromptPanel(){

const [prompt,setPrompt]=useState("");
const [negativePrompt,setNegativePrompt]=useState("");
const [style,setStyle]=useState("cinematic");
const [images,setImages]=useState<string[]>([]);
const [loading,setLoading]=useState(false);

const generate=async()=>{

setLoading(true);

const r=await fetch("/api/ai-images/generate",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
prompt,
negativePrompt,
style,
variants:4
})
});

const data=await r.json();

setImages(data.output||[]);

setLoading(false);
};

return(
<div>

<h3>Prompt</h3>

<textarea
value={prompt}
onChange={(e)=>setPrompt(e.target.value)}
placeholder="Describe scene..."
style={{
width:"100%",
height:"150px"
}}
/>

<h3>Negative Prompt</h3>

<textarea
value={negativePrompt}
onChange={(e)=>setNegativePrompt(e.target.value)}
style={{
width:"100%",
height:"100px"
}}
/>

<h3>Style</h3>

<select
value={style}
onChange={(e)=>setStyle(e.target.value)}
>
<option value="cinematic">
Cinematic
</option>

<option value="cyberpunk">
Cyberpunk
</option>

<option value="horror">
Horror
</option>

<option value="superhero">
Superhero
</option>

</select>

<br/><br/>

<button onClick={generate}>
Generate 4 Variants
</button>

{loading && <p>Generating...</p>}

<div style={{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:"20px",
marginTop:"30px"
}}>

{images.map((img,i)=>(

<div key={i}>
<img
src={img}
style={{width:"100%"}}
/>

<a href={img} download>
Download
</a>

</div>

))}

</div>

</div>
)

}
