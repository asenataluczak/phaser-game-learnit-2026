# Tworzenie <nasza_nazwa> - webowej gry multiplayer w JavaScript (Phaser)

// Podsumowanie tego, co robiliśmy na zajęciach  
// Ten dokument będzie co tydzień ewoluował

## 1. Świat game devu w JavaScript

### 1.1 Bazowe technologie  
Obie służą do renderowania interaktywnej grafiki w przeglądarce
  
| [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)     | [WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) |
| ----------- | ----------- |
| 2D   | 2D + 3D        |
| Wysokopoziomowe   | Niskopoziomowe (na tyle, że z reguły nie uczysz się WebGL API bezpośrednio, tylko wykorzystujesz jakąś bibliotekę, która używa WebGL)     |
| Proste do nauki, sprowadza się do rysowania i animowania różnych kształtów   | Trudniejsze do nauki, sprowadza się do komunikacji z GPU w taki sposób, żeby on narysował różne kształty (pisanie shaderów, matematyka graficzna, itp.)        |
| Średnia wydajność   | Wysoka wydajnosć (GPU)        |
| Do prostych gier i animacji   | Do zaawansowanych gier i efektów graficznych        |

### 1.2 Przykładowe biblioteki
- [Phaser](https://phaser.io/) 
- [Three.js](https://threejs.org/)
- [p5.js](https://p5js.org/)
  - https://www.youtube.com/@TheCodingTrain

### 1.3 Platformy

- Przeglądarka (wiadomo)
- Mobilne (Android, iOS) - np. używając [Capacitor](https://capacitorjs.com/)
- Desktopy (Windows, macOS, Linux) - np. używając [Electron](https://www.electronjs.org/)
- VR, konsole, itp. - na cokolwiek istnieje biblioteka/wrapper do połączenia funkcjonalności JSowych z natywnymi danej platformy

### 1.4 Kiedy tworzenie gry w JavaScript ma sens
- do małych i nieskomplikowanych projektów
- do tworzenia prototypów/demo
- kiedy chcemy grę przeglądarkową
- kiedy chcemy grę multiplayer
- tak o, dla funu

### 1.5 Game Jams
- [js13kGames](https://js13kgames.com/)
- [Gamedev.js Jam](https://gamedevjs.com/jam/2025/)
- [Game Jams on itch.io](https://itch.io/jams)
- [Phaser Game Jam](https://phaser.io/news/2025/11/phaser-game-jam-2025)

### 1.6 Przykładowe gry

- [Q1K3](https://phoboslab.org/q1k3/) (HTML Canvas, js13kGames 2021)
- Inne:
  - [Top Games tagged javascript on itch.io](https://itch.io/games/tag-javascript)
  - [js13kGames 2025](https://js13kgames.com/2025/games)
  - [Phaser games](https://phaser.io/games)

## 2. Powtórka z JavaScript

Playground: https://www.jsplayground.dev/  
Kurs: https://javascript.info/  
Podobny kurs po polsku: https://kursjs.pl/


### 2.1 [Obiekty](https://javascript.info/object-basics)
- Utworzenie obiektu: `const obj = { name: 'John' }`
- Dostęp do property (dot notation): `obj.name`
- Dostęp do property (square brackets notation): `obj['name']` albo `obj[jakasZmienna]`
- Dodanie do obiektu kolejnego property: `obj.age = 21`
- Zmiana wartości istniejącego property: `obj.age = 23`
- Usunięcie property: `delete obj.age`
- Utworzenie obiektu z nested properties: `const cat = { data: { name: 'Miaurycy' } }`
- Dostęp do nested property: `cat.data.name`
- Optional chaining:
  - `obj?.prop` – zwraca `obj.prop` jeśli `obj` istnieje, w przeciwnym razie `undefined`
  - `obj?.[prop]` – zwraca `obj[prop]` jeśli `obj` istnieje, w przeciwnym razie `undefined`
   - `obj.method?.()` – wywołuje `obj.method()` jeśli `obj.method` istnieje, w przeciwnym razie zwraca `undefined`
 - Funkcje w obiektach (metody)
   - `const cat = { sayMeow: function() { console.log('Meow') } }` albo krócej `const cat = { sayMeow() { console.log('Meow') } }`
   - Wywoływanie: `cat.sayMeow()`
   - Metody mogą odwoływać się do obiektu jako `this`:
        ```
        const obj = {
            name: "Ala",
            show() {
                console.log(this.name);
            }
        };
        obj.show(); // "Ala"
        ```
 

### 2.2 [Funkcje](https://javascript.info/function-basics)

- Function declaration 
    ```
    function sayHi() {
        alert( "Hello" );
    }
    ```
- Function expression 
    ```
    let sayHi = function() {
        alert( "Hello" );
    };
    ```
- Domyślne wartości: 
    ```
    function showMessage(from, text = "no text given") {
        alert( from + ": " + text );
    }

    showMessage("Ann"); // Ann: no text given
    ```
- Arrow functions (funkcje strzałkowe)
  - bez nawiasów klamrowych: `const sayHi = (name) => name;` - zwraca name
  - z nawiasami klamrowymi: 
    ```
    const sayHi = (name) => { 
        console.log('name'); // Wykonuje kod w {}
        return name; // Wymaga 'return' żeby coś zwrócić
    }
    ```
  - żeby zwrócić obiekt, można go owrappować w okrągłe nawiasy: 
    ```
    // Dłuższy syntax
    const sayHi = (name) => { 
        return { 
            firstname: name, 
            age: 23 
        };
    }

    // Krótszy syntax
    const sayHi = (name) => ({ firstname: name, age: 23 });
    ```
  
- Callback - funkcja przekazywana jako argument (do wywołania później): `sayHi("hi", () => { ... })`

### 2.3 [Klasy](https://javascript.info/classes)

```
    class MyClass {
        prop1 = value; // Utworzenie property z domyślną wartością
        prop2; // Utworzenie property bez domyślnej wartości

        constructor(incomingValue, ...) { 
            // Specjalna metoda używana do:
            //  - tworzenia obiektu z klasy
            //  - przypisywania początkowych wartości do properties
            // Upraszczając można też powiedzieć, że jest to kod uruchamiany przy tworzeniu klasy

            this.prop2 = incomingValue; // Przypisanie początkowej wartości (zmienna nadawana przy tworzeniu obiektu) do prop2 
        }

        method1(...) {  } 

        method2(...) {
            // Dostęp do method/properties klasy jest przez `this.`
            console.log(this.prop);
            this.method1();
        } 
    }
```
- Klasy służą jako templatki na bazie których można tworzyć wiele obiektów (jest to też do osiągnięcia [zwykłymi funkcjami](https://javascript.info/class#not-just-a-syntactic-sugar), ale klasy dostarczają więcej przydatnych funkcjonalności)
- Instancja - konkretny obiekt, który powstał na bazie klasy (np. jeśli stworzymy obiekt z klasy  `Pies` o nazwie `Fafik` to obiekt `Fafik` jest instancją klasy `Pies`)
- Tworzenie instancji (`new`):
  ```
    class User {
        name;

        constructor(customName){
            this.name = customName;
        }
    }

    let user = new User('Gniewosz'); 
    console.log(user.name); // Gniewosz
    ```
- Można tworzyć klasę na bazie innej klasy słówkiem `extends`: `class Child extends Parent {}` (Zakładając, że klasa Animal już istnieje. Instancja klasy Dog będzie miała dostęp properties i metod z obu klas)
- Słówko `super` odności się do klasy 'rodzica'

## 3. Setup lokalny

### 3.1 Prerequisites
- Node.js - https://nodejs.org/en/download
  - sprawdzenie czy jest zainstalowany: `node -v`, `npm -v`
- git - https://git-scm.com/install/windows
  - ustawienie globalnej tożsamości:
  ```
    $ git config --global user.name "John Doe"
    $ git config --global user.email johndoe@example.com
  ```
- VS Code - https://code.visualstudio.com/Download

### 3.2 Utworzenie repo z grą demo

Phaser udostępnia narzędzie do stworzenia projektu z templatki - `create-game-app`

Instrukcja do `create-game-app` - https://phaser.io/tutorials/create-game-app

W naszym przypadku kolejność komend/wyboru:

1. `npm create @phaserjs/game@latest`
2. Wpisanie swojej nazwy projektu
3. Wybór `Demo Game`
4. Wybór `Phaser's Revenge - Space Action Pixel Art Game`

I teraz żeby z powstałego projektu zrobić repo na GitHubie:

1. Dodanie pliku `.gitignore` z folderami których nie chcemy mieć w repo (node_modules, .vscode)
2. Utworzenie repo na GitHubie (najlepiej o takiej samej nazwie jak projekt) i skopiowanie linka do repo
3. W folderze z projektem: 
    ```
    git init
    git add .
    git commit -m "my commit"
    git remote add origin <link-do-repo>
    git push origin main
    ```
   
### 3.3 `jsconfig.json`

Żeby VS Code podpowiadał metody i properties z Phasera, do folderu projektu trzeba dodać plik `jsconfig.json` o poniższej zawartości:

```
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "noImplicitAny": false,
    "strictPropertyInitialization": false,
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

Wyjaśnienie z dokumentacji VS Code: https://code.visualstudio.com/docs/languages/jsconfig

## 4. Phaser concepts

https://docs.phaser.io/

- main config
- scenes
- game loop