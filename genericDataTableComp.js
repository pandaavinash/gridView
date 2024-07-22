import {api, LightningElement, track} from "lwc";
 
const delay = 300;
const pageNumber = 1;
const hideIt = "visibility:hidden";
const showIt = "visibility:visible";
const recordsPerPage = [6, 12, 24, 100];
 
export default class GenericDataTableComp extends LightningElement {
    @api
    get columns() {
        return this._columns;
    }
 
    set columns(value) {
        this._columns = value;
    }
 
    @api
    get records() {
        return this._data;
    }
 
    set records(value) {
        this._data = value;
        this._recordsToDisplay = this._data;
        this._totalRecords = this._data.length;
        if (this._pageSizeOptions && this._pageSizeOptions.length > 0) {
            this._pageSize = this._pageSizeOptions[0];
        } else {
            this._pageSize = this._totalRecords;
            this.showPagination = false;
        }
        this._controlPagination = this.showPagination === false ? hideIt : showIt;
        this.setRecordsToDisplay();
        //this.disableRow(this._data);
    }
 
    @api
    get enableEditAction() {
        return this._editAction;
    }
 
    set enableEditAction(value) {
        this._editAction = value;
    }
 
    @api
    get enableDeleteAction() {
        return this._deleteAction;
    }
 
    set enableDeleteAction(value) {
        this._deleteAction = value;
        if (value) {
            let deleteColumns = JSON.parse(JSON.stringify(this._columns));
            deleteColumns.push({
                type: "button-icon",
                typeAttributes: {iconName: "utility:delete", name: "delete", iconClass: "slds-icon-text-error"},
                fixedWidth: 50
            });
            this._columns = deleteColumns;
        }
    }
 
    @api
    get disableCheckboxColumn() {
        return this._hideCheckboxColumn;
    }
 
    set disableCheckboxColumn(value) {
        this._hideCheckboxColumn = value;
    }
 
    @api
    get enableSearchBox() {
        return this._showSearchBox;
    }
 
    set enableSearchBox(value) {
        this._showSearchBox = value;
    }
 
    @api
    get enableRowNumberColumn() {
        return this._showRowNumberColumn;
    }
 
    set enableRowNumberColumn(value) {
        this._showRowNumberColumn = value;
    }
 
    @api
    get enableGridPagination() {
        return this._showGridPagination;
    }
 
    set enableGridPagination(value) {
        this._showGridPagination = value;
    }
    @track _hideCheckboxColumn = false;
    @track _showRowNumberColumn = false;
    @track _defaultSortDirection = "desc";
    @track _sortDirection = "desc";
    @track _sortedBy = "createdDate";
    @track _maxLinesToWrap = "4";
    @track _showSearchBox = false;
    @track _showGridPagination = false;
    @track _pageSizeOptions = recordsPerPage;
    @track _subTotal = 0.0;
    @track _discount = 0.0;
    @track _total = 0.0;
    @track _columns = [];
    @track _data = [];
    @track _editAction = false;
    @track _deleteAction = false;
    @track _recordsToDisplay = [];
    @track _pageSize;
    @track _totalPages;
    @track _searchKey;
    @track _totalRecords;
    @track _pageNumber = pageNumber;
    @track _controlPagination = showIt;
    @track _controlPrevious = hideIt;
    @track _controlNext = showIt;
    @track _delayTimeout = delay;
    @track _showGridView = true;
    @track _currentSelectedRows = [];
    @track showPagination;
    @track tempRow = {};
    @track editIndex = 0;
 
    handleRowAction(event) {
        this.deleteSelectedRow(event.detail.row);
    }
 
    // disableRow(data) {
    //     this._recordsToDisplay = data.map(row => {
    //         let newRow = { ...row };
    //         if (newRow.hasOwnProperty('isEligible') && newRow.isEligible === 'false') {
    //             console.log('$$$ Inside  newRow.customClass');
    //             newRow.customClass = 'disabled-row';
    //         }
    //         return newRow;
    //     });
    // }
 
    // getRowClassName(row) {
    //     console.log('$$$ Inside  newRow.customClass');
    //     return row.customClass;
    // }
 
    handleRowSelection(event) {
        let checked = event.detail.config.checked;
        console.log('$$$ checked :' + JSON.stringify(event.detail));
        switch (event.detail.config.action) {
            case 'selectAllRows':
                for (let i = 0; i < event.detail.selectedRows.length; i++) {
                    //selectedData.push(event.detail.selectedRows[i]);
                    this._currentSelectedRows.push(event.detail.selectedRows[i]);
                }
                break;
            case 'deselectAllRows':
                this._currentSelectedRows = [];
                break;
            case 'rowSelect':
                this._currentSelectedRows.push(event.detail.config.value);
                break;
            case 'rowDeselect':
                this._currentSelectedRows= this._currentSelectedRows.filter(item => item != event.detail.config.value);
               
                break;
            default:
                break;
        }
        // if (checked){
        //     console.log('$$$ inside checked :' + checked);
        //     this._currentSelectedRows = [...this._currentSelectedRows];
        //     console.log('$$$ _currentSelectedRows :' + this._currentSelectedRows);
        //     event.detail.selectedRows.reduce((accumulator, currentValue) => {
        //         if (currentValue.uid) {
        //             this._currentSelectedRows.push(currentValue.uid);
        //         }
        //     }, true);
        // }
        // console.log('$$$ selectedRows :' + event.detail.selectedRows);
 
        this.dispatchEvent(new CustomEvent("rowselectioncomplete", {
            detail: {
                type: "RowSelectionComplete",
                value: this._currentSelectedRows
            }
        }));
    }
 
    handleSave(event) {
        let newData = JSON.parse(JSON.stringify(this._data));
        const draftValues = event.detail.draftValues;
        draftValues.forEach(element => {
            this.editindex = this._data.findIndex(row => row.uid === element.uid);
            this.tempRow = {...this._data[this.editindex]};
           
            newData[this.editindex] = this.tempRow;
        });
        this.tempRow = {};
        this._data = newData;
        this._recordsToDisplay = this._data;
        this.setRecordsToDisplay();
        this.dispatchEvent(new CustomEvent("savecomplete", {
            detail: {
                type: "SaveComplete",
                value: draftValues
            }
        }));
        this.draftValues = {};
    }
 
    handleDeleteSelectedRow(deleteRow) {
        this.dispatchEvent(new CustomEvent("deleteselectedrowcomplete", {detail: { value: deleteRow } }));
    }
 
    handleGridSort(event) {
        const {fieldName: _sortedBy, _sortDirection} = event.detail;
        const cloneData = [...this._data];
        cloneData.sort(this.handleSortedBy(_sortedBy, _sortDirection === "asc" ? 1 : -1));
        this._data = cloneData;
        this._sortDirection = _sortDirection;
        this._sortedBy = _sortedBy;
        this.setRecordsToDisplay();
    }
 
    handleSortedBy(field, reverse, primer) {
        const keyPrimer = primer
            ? function (x) {
                return primer(x[field]);
            }
            : function (x) {
                return x[field];
            };
 
        return function (a, b) {
            a = keyPrimer(a);
            b = keyPrimer(b);
            return reverse * ((a > b) - (b > a));
        };
    }
 
    deleteSelectedRow(deleteRow) {
        let agree = confirm("Are you sure you wish to delete this record ?");
        if (agree) {
            let newData = JSON.parse(JSON.stringify(this._data));
            newData = newData.filter((row) => row.uid !== deleteRow.uid);
            newData.forEach((element, index) => (element.uid = index + 1));
            this._data = newData;
            this._recordsToDisplay = this._data;
            this.setRecordsToDisplay();
            this.handleDeleteSelectedRow(deleteRow);
        }
    }
 
    handleRecordsPerPage(event) {
        this._pageSize = event.target.value;
        this.setRecordsToDisplay();
    }
 
    handlePageNumberChange(event) {
        if (event.keyCode === 13) {
            this._pageNumber = event.target.value;
            this.setRecordsToDisplay();
        }
    }
 
    handlePreviousPage() {
        this._pageNumber = this._pageNumber - 1;
        this.setRecordsToDisplay();
    }
 
    handleNextPage() {
        this._pageNumber = this._pageNumber + 1;
        this.setRecordsToDisplay();
    }
 
    setRecordsToDisplay() {
        this._recordsToDisplay = [];
        this._currentSelectedRows = [];
        if (!this._pageSize) this._pageSize = this._totalRecords;
 
        this._totalPages = Math.ceil(this._totalRecords / this._pageSize);
        this.setPaginationControls();
        for (let i = (this._pageNumber - 1) * this._pageSize; i < this._pageNumber * this._pageSize;i++) {
            if (i === this._totalRecords) break;
            this._recordsToDisplay.push(this._data[i]);
            /*this._preSelectedRows.forEach(element => {
                if (this._data[i].uid === element) {
                    this._currentSelectedRows.push(this._data[i].uid);
                }
            });*/
        }
        this.handlePaginatorChange(new CustomEvent("paginatorchange", {detail:this._recordsToDisplay}));
    }
 
    setPaginationControls() {
        if (this._totalPages === 1) {
            this._controlPrevious = hideIt;
            this._controlNext = hideIt;
        } else if (this._totalPages > 1) {
            this._controlPrevious = showIt;
            this._controlNext = showIt;
        }
 
        if (this._pageNumber <= 1) {
            this._pageNumber = 1;
            this._controlPrevious = hideIt;
        } else if (this._pageNumber >= this._totalPages) {
            this._pageNumber = this._totalPages;
            this._controlNext = hideIt;
        }
 
        if (this._controlPagination === hideIt) {
            this._controlPrevious = hideIt;
            this._controlNext = hideIt;
        }
    }
 
    handlePaginatorChange(event) {
        this._recordsToDisplay = event.detail;
    }
 
    handleKeyChange(event) {
        window.clearTimeout(this._delayTimeout);
        const searchKey = event.target.value;
        if (searchKey) {
            this._delayTimeout = setTimeout(() => {
                this._controlPagination = hideIt;
                this.setPaginationControls();
 
                this._searchKey = searchKey;
                this._recordsToDisplay = this._data.filter((rec) => JSON.stringify(rec).toLowerCase().includes(searchKey.toLowerCase()));
                if (Array.isArray(this._recordsToDisplay) && this._recordsToDisplay.length > 0)
                    this.handlePaginatorChange(new CustomEvent("paginatorchange", {detail:this._recordsToDisplay}));
            }, delay);
        } else {
            this._controlPagination = showIt;
            this.setRecordsToDisplay();
        }
    }
   
}