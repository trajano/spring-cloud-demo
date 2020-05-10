<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      For learning about keycloak<br>
      check out the
      <a href="https://medium.com/keycloak" target="_blank" rel="noopener">keycloak</a>.
    </p>
    <pre>{{ serviceOutput }}</pre>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
        serviceOutput: { "loading": "true" }
    }
  },

  props: {
    msg: String
  },
  async mounted() {
    let foo = await fetch('https://i.trajano.net/v1/sample', {
       method: 'get',
       headers: new Headers({
         'Authorization': 'Bearer ' + localStorage["vue-token"]
       }),
     });
     this.serviceOutput = await foo.json()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.hello {
text-align: left;
}
</style>
