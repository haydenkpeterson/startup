# CS 260 Notes

[My startup - Audit App](url)

## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

## GITHUB

I refreshed my memory of Git commands and their purposes. I also refamiliarized myself with Visual Studio Code, and how to use Git commands through Source Control.

## AWS

My IP address is: 18.211.42.4
in order to ssh and use my key use ~/.ssh/production.pem


## Caddy

followed all the instructions. It worked perfectly.

## HTML

I structured out everything, but used an AI helper to quickly create my different fields i needed. It was almost instantaneous, I just had to change a few different areas of the code to fit my needs. I had trouble with getting the simon subdomain working.

## CSS

I enjoyed writing the css styling for my application. I made a basic scaffolding, and then asked AI for specific help to implement my ideas. think my end result looks really functional, but I'm excited to start using react and get a little more out of my webapp.

## React Part 1: Routing

Had to update class to className in my html. React components were easy to figure out. Hard to debug because of how precise you have to be.

## React Part 2: Reactivity

This was a lot of fun to see it all come together. I had to keep remembering to use React state instead of just manipulating the DOM directly.

Handling the toggling of the checkboxes was particularly interesting.

```jsx
<div className="input-group sound-button-container">
  {calmSoundTypes.map((sound, index) => (
    <div key={index} className="form-check form-switch">
      <input
        className="form-check-input"
        type="checkbox"
        value={sound}
        id={sound}
        onChange={() => togglePlay(sound)}
        checked={selectedSounds.includes(sound)}
      ></input>
      <label className="form-check-label" htmlFor={sound}>
        {sound}
      </label>
    </div>
  ))}
</div>
```
