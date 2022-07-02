function initAutocomplete(){   
    const mb = document.querySelectorAll('.materialboxed');
    M.Materialbox.init(mb, {});

    // Auto Complete
    const ac = document.querySelector('.autocomplete-destination');
    M.Autocomplete.init(ac, {
        data: {
          "Mars": null,
          "ISS": null,
          "Andromeda": null,
        }
      });
}