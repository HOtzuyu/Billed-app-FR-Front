import {
  ROUTES_PATH
} from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({
    document,
    onNavigate,
    store,
    localStorage
  }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({
      document,
      localStorage,
      onNavigate
    });
  }


  handleChangeFile = (e) => {
    e.preventDefault();
    const inputFile = this.document.querySelector(`input[data-testid="file"]`);
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    // fix #3 : [Bug Hunt] - Bills
    // vérifier si l'extension du fichier est bien dans les format jpg|png|jpeg
    // Récupère le fichier
    const fileType = file.type;
    //initialisation du RegExp
    const regexFile = /(jpg|png|jpeg)$/i;
    //test le fichier avec le RegExp
    const testFile = regexFile.test(fileType);
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);
    //si le test est ok alors on continue
    if (testFile) {
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({
          fileUrl,
          key
        }) => {
          this.billId = key;
          this.fileUrl = fileUrl;
          this.fileName = fileName;
        })
        .catch((error) => console.error(error));
      //si le test n'est pas bon on affiche une alert
    } else {
      alert("Votre fichier doit être au format PNG, JPG ou JPEG");
      //le nom de l'image avec mauvaise extension ne doit pas apparaitre
      inputFile.value = "";
    }
  };


  handleSubmit = (e) => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({
          data: JSON.stringify(bill),
          selector: this.billId
        })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}